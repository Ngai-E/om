import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface AuditLogData {
  userId?: string;
  action: string;
  entity: string;
  entityId: string;
  changes?: any;
  ipAddress?: string;
  userAgent?: string;
  tenantId?: string;
}

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async log(data: AuditLogData) {
    try {
      // Verify user exists if userId is provided
      if (data.userId) {
        const userExists = await this.prisma.user.findUnique({
          where: { id: data.userId },
          select: { id: true },
        });
        
        // If user doesn't exist, set userId to null
        if (!userExists) {
          console.warn(`⚠️  User ${data.userId} not found, creating audit log without user reference`);
          data.userId = undefined;
        }
      }

      await this.prisma.auditLog.create({
        data: {
          userId: data.userId || null,
          action: data.action,
          entity: data.entity,
          entityId: data.entityId,
          changes: data.changes || null,
          ipAddress: data.ipAddress || null,
          userAgent: data.userAgent || null,
          ...(data.tenantId && { tenantId: data.tenantId }),
        },
      });

      console.log(`📝 Audit: ${data.action} on ${data.entity}:${data.entityId} by user:${data.userId || 'system'}`);
    } catch (error) {
      console.error('Failed to create audit log:', error.message);
    }
  }

  async getAuditLogs(filters: {
    userId?: string;
    entity?: string;
    entityId?: string;
    action?: string;
    startDate?: Date;
    endDate?: Date;
    page?: number;
    limit?: number;
    tenantId?: string;
  }) {
    const { page = 1, limit = 50, ...where } = filters;
    const skip = (page - 1) * limit;

    const whereClause: any = {};

    if (where.userId) whereClause.userId = where.userId;
    if (where.entity) whereClause.entity = where.entity;
    if (where.entityId) whereClause.entityId = where.entityId;
    if (where.action) whereClause.action = where.action;
    if (where.tenantId) whereClause.tenantId = where.tenantId;

    if (where.startDate || where.endDate) {
      whereClause.createdAt = {};
      if (where.startDate) whereClause.createdAt.gte = where.startDate;
      if (where.endDate) whereClause.createdAt.lte = where.endDate;
    }

    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where: whereClause,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              role: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.auditLog.count({ where: whereClause }),
    ]);

    return {
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getEntityHistory(entity: string, entityId: string) {
    return this.prisma.auditLog.findMany({
      where: {
        entity,
        entityId,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getUserActivity(userId: string, page = 1, limit = 50) {
    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.auditLog.count({ where: { userId } }),
    ]);

    return {
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
