import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * EntitlementsService - Manages plan-based feature access and usage limits
 * 
 * Responsibilities:
 * - Check if a tenant has access to a feature
 * - Get usage limits for a tenant
 * - Validate usage against limits
 */
@Injectable()
export class EntitlementsService {
  private readonly logger = new Logger(EntitlementsService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Check if a tenant has access to a specific feature
   */
  async hasFeature(tenantId: string, featureKey: string): Promise<boolean> {
    try {
      // Get active subscription for tenant
      const subscription = await this.prisma.subscription.findFirst({
        where: {
          tenantId,
          status: { in: ['TRIALING', 'ACTIVE'] },
        },
        include: {
          plan: {
            include: {
              entitlements: {
                where: { key: featureKey },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      if (!subscription) {
        this.logger.warn(`No active subscription found for tenant ${tenantId}`);
        return false;
      }

      const entitlement = subscription.plan.entitlements.find(e => e.key === featureKey);
      
      if (!entitlement) {
        this.logger.debug(`Feature ${featureKey} not found in plan ${subscription.plan.code}`);
        return false;
      }

      // For boolean features, check the boolean value
      if (entitlement.valueType === 'BOOLEAN') {
        return entitlement.booleanValue === true;
      }

      // For integer/string features, having the entitlement means it's enabled
      return true;
    } catch (error) {
      this.logger.error(`Error checking feature ${featureKey} for tenant ${tenantId}`, error);
      return false;
    }
  }

  /**
   * Get the limit value for a specific entitlement
   */
  async getLimit(tenantId: string, limitKey: string): Promise<number | null> {
    try {
      const subscription = await this.prisma.subscription.findFirst({
        where: {
          tenantId,
          status: { in: ['TRIALING', 'ACTIVE'] },
        },
        include: {
          plan: {
            include: {
              entitlements: {
                where: { key: limitKey },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      if (!subscription) {
        this.logger.warn(`No active subscription found for tenant ${tenantId}`);
        return null;
      }

      const entitlement = subscription.plan.entitlements.find(e => e.key === limitKey);
      
      if (!entitlement || entitlement.valueType !== 'INTEGER') {
        return null;
      }

      return entitlement.intValue;
    } catch (error) {
      this.logger.error(`Error getting limit ${limitKey} for tenant ${tenantId}`, error);
      return null;
    }
  }

  /**
   * Get all entitlements for a tenant's active subscription
   */
  async getEntitlements(tenantId: string): Promise<Record<string, any>> {
    try {
      const subscription = await this.prisma.subscription.findFirst({
        where: {
          tenantId,
          status: { in: ['TRIALING', 'ACTIVE'] },
        },
        include: {
          plan: {
            include: {
              entitlements: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      if (!subscription) {
        this.logger.warn(`No active subscription found for tenant ${tenantId}`);
        return {};
      }

      const entitlements: Record<string, any> = {};

      for (const ent of subscription.plan.entitlements) {
        switch (ent.valueType) {
          case 'BOOLEAN':
            entitlements[ent.key] = ent.booleanValue;
            break;
          case 'INTEGER':
            entitlements[ent.key] = ent.intValue;
            break;
          case 'STRING':
            entitlements[ent.key] = ent.textValue;
            break;
        }
      }

      return entitlements;
    } catch (error) {
      this.logger.error(`Error getting entitlements for tenant ${tenantId}`, error);
      return {};
    }
  }

  /**
   * Get tenant's current plan details
   */
  async getCurrentPlan(tenantId: string) {
    try {
      const subscription = await this.prisma.subscription.findFirst({
        where: {
          tenantId,
          status: { in: ['TRIALING', 'ACTIVE'] },
        },
        include: {
          plan: {
            include: {
              entitlements: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      if (!subscription) {
        return null;
      }

      return {
        planCode: subscription.plan.code,
        planName: subscription.plan.name,
        status: subscription.status,
        trialEndsAt: subscription.trialEndsAt,
        currentPeriodEndsAt: subscription.currentPeriodEndsAt,
      };
    } catch (error) {
      this.logger.error(`Error getting current plan for tenant ${tenantId}`, error);
      return null;
    }
  }
}
