import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as crypto from 'crypto';

/**
 * DomainVerificationService - Manages custom domain verification
 * 
 * Verification methods:
 * - DNS TXT record
 * - DNS CNAME record
 * - Meta tag (for future implementation)
 */
@Injectable()
export class DomainVerificationService {
  private readonly logger = new Logger(DomainVerificationService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Add a custom domain for a tenant
   */
  async addCustomDomain(tenantId: string, domain: string) {
    // Validate domain format
    const domainRegex = /^[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,}$/i;
    if (!domainRegex.test(domain)) {
      throw new BadRequestException('Invalid domain format');
    }

    // Check if domain is already in use
    const existing = await this.prisma.tenantDomain.findUnique({
      where: { domain },
    });

    if (existing) {
      throw new BadRequestException('Domain is already in use');
    }

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');

    // Create domain record
    const tenantDomain = await this.prisma.tenantDomain.create({
      data: {
        tenantId,
        domain,
        type: 'CUSTOM',
        isPrimary: false,
        verificationStatus: 'PENDING',
        sslStatus: 'PENDING',
      },
    });

    // Create verification record
    const verification = await this.prisma.tenantDomainVerification.create({
      data: {
        tenantDomainId: tenantDomain.id,
        token: verificationToken,
        method: 'DNS_TXT',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });

    return {
      domainId: tenantDomain.id,
      domain: tenantDomain.domain,
      verificationStatus: tenantDomain.verificationStatus,
      verificationToken,
      verificationInstructions: {
        method: 'DNS_TXT',
        recordType: 'TXT',
        recordName: `_verification.${domain}`,
        recordValue: verificationToken,
        instructions: [
          '1. Log in to your domain registrar (e.g., GoDaddy, Namecheap, Cloudflare)',
          '2. Navigate to DNS settings for your domain',
          `3. Add a TXT record with name: _verification.${domain}`,
          `4. Set the value to: ${verificationToken}`,
          '5. Save the DNS record',
          '6. Wait for DNS propagation (can take up to 48 hours)',
          '7. Click "Verify Domain" to complete verification',
        ],
      },
    };
  }

  /**
   * Verify a custom domain
   */
  async verifyDomain(tenantId: string, domainId: string): Promise<boolean> {
    const tenantDomain = await this.prisma.tenantDomain.findFirst({
      where: {
        id: domainId,
        tenantId,
      },
      include: {
        verification: true,
      },
    });

    if (!tenantDomain) {
      throw new NotFoundException('Domain not found');
    }

    if (tenantDomain.verificationStatus === 'VERIFIED') {
      return true;
    }

    if (!tenantDomain.verification) {
      throw new BadRequestException('No verification record found');
    }

    // Check if verification has expired
    if (tenantDomain.verification.expiresAt && tenantDomain.verification.expiresAt < new Date()) {
      throw new BadRequestException('Verification token has expired. Please request a new one.');
    }

    // Perform DNS verification
    const isVerified = await this.verifyDNSTXT(
      tenantDomain.domain,
      tenantDomain.verification.token
    );

    if (isVerified) {
      // Update domain status
      await this.prisma.tenantDomain.update({
        where: { id: domainId },
        data: {
          verificationStatus: 'VERIFIED',
        },
      });

      this.logger.log(`Domain verified: ${tenantDomain.domain} for tenant ${tenantId}`);
      return true;
    }

    return false;
  }

  /**
   * Verify DNS TXT record
   */
  private async verifyDNSTXT(domain: string, expectedToken: string): Promise<boolean> {
    try {
      const dns = require('dns').promises;
      const recordName = `_verification.${domain}`;
      
      const records = await dns.resolveTxt(recordName);
      
      // Check if any TXT record matches the expected token
      for (const record of records) {
        const value = Array.isArray(record) ? record.join('') : record;
        if (value === expectedToken) {
          return true;
        }
      }

      return false;
    } catch (error) {
      this.logger.warn(`DNS verification failed for ${domain}:`, error.message);
      return false;
    }
  }

  /**
   * Set a domain as primary
   */
  async setPrimaryDomain(tenantId: string, domainId: string) {
    const domain = await this.prisma.tenantDomain.findFirst({
      where: {
        id: domainId,
        tenantId,
      },
    });

    if (!domain) {
      throw new NotFoundException('Domain not found');
    }

    if (domain.verificationStatus !== 'VERIFIED') {
      throw new BadRequestException('Domain must be verified before setting as primary');
    }

    // Unset current primary
    await this.prisma.tenantDomain.updateMany({
      where: {
        tenantId,
        isPrimary: true,
      },
      data: {
        isPrimary: false,
      },
    });

    // Set new primary
    await this.prisma.tenantDomain.update({
      where: { id: domainId },
      data: {
        isPrimary: true,
      },
    });

    return { success: true };
  }

  /**
   * Remove a custom domain
   */
  async removeDomain(tenantId: string, domainId: string) {
    const domain = await this.prisma.tenantDomain.findFirst({
      where: {
        id: domainId,
        tenantId,
        type: 'CUSTOM', // Can't remove subdomain
      },
    });

    if (!domain) {
      throw new NotFoundException('Custom domain not found');
    }

    if (domain.isPrimary) {
      throw new BadRequestException('Cannot remove primary domain. Set another domain as primary first.');
    }

    await this.prisma.tenantDomain.delete({
      where: { id: domainId },
    });

    return { success: true };
  }

  /**
   * Get all domains for a tenant
   */
  async getDomains(tenantId: string) {
    return this.prisma.tenantDomain.findMany({
      where: { tenantId },
      include: {
        verification: true,
      },
      orderBy: [
        { isPrimary: 'desc' },
        { createdAt: 'asc' },
      ],
    });
  }
}
