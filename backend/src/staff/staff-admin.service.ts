import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UsageService } from '../entitlements/usage.service';

/**
 * StaffAdminService - Handles staff creation with entitlement enforcement
 * 
 * CRITICAL: Always enforces staff limits before creation
 */
@Injectable()
export class StaffAdminService {
  constructor(
    private prisma: PrismaService,
    private usageService: UsageService,
  ) {}

  /**
   * Create staff member with strict limit enforcement
   */
  async createStaffMember(tenantId: string, data: any) {
    // CRITICAL: Enforce staff limit BEFORE creation
    await this.usageService.enforceStaffLimit(tenantId);

    // Create staff user
    const staff = await this.prisma.user.create({
      data: {
        ...data,
        tenantId, // ALWAYS set from context, NEVER from DTO
        role: data.role || 'STAFF',
      },
    });

    return staff;
  }

  /**
   * Check if tenant can add more staff
   */
  async canAddStaff(tenantId: string): Promise<boolean> {
    return this.usageService.canAddStaff(tenantId);
  }
}
