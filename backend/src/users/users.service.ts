import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto, ChangePasswordDto, CreateAddressDto, UpdateAddressDto } from './dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async findById(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  // ============================================
  // PROFILE MANAGEMENT
  // ============================================

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        emailVerified: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        addresses: {
          orderBy: { isDefault: 'desc' },
        },
        _count: {
          select: {
            orders: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    // Check if email is being changed and if it's already taken
    if (dto.email) {
      const existing = await this.prisma.user.findUnique({
        where: { email: dto.email },
      });

      if (existing && existing.id !== userId) {
        throw new BadRequestException('Email already in use');
      }
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: dto,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        updatedAt: true,
      },
    });

    return updated;
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Verify current password
    const isValid = await bcrypt.compare(dto.currentPassword, user.password);
    if (!isValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(dto.newPassword, 10);

    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    return { message: 'Password changed successfully' };
  }

  // ============================================
  // ADDRESS MANAGEMENT
  // ============================================

  async getAddresses(userId: string) {
    const addresses = await this.prisma.address.findMany({
      where: { userId },
      include: {
        deliveryZone: {
          select: {
            id: true,
            name: true,
            deliveryFee: true,
          },
        },
      },
      orderBy: { isDefault: 'desc' },
    });

    return addresses;
  }

  async createAddress(userId: string, dto: CreateAddressDto) {
    // Find delivery zone for this postcode
    const normalizedPostcode = dto.postcode.replace(/\s/g, '').toUpperCase();
    const areaMatch = normalizedPostcode.match(/^([A-Z]{1,2})(\d{1,2})/);
    
    let deliveryZoneId: string | undefined;
    
    if (areaMatch) {
      const letters = areaMatch[1];
      const digits = areaMatch[2];
      const possiblePrefixes = [
        `${letters}${digits}`,
        digits.length === 2 ? `${letters}${digits[0]}` : null,
      ].filter(Boolean) as string[];

      const zone = await this.prisma.deliveryZone.findFirst({
        where: {
          isActive: true,
          postcodePrefix: {
            hasSome: possiblePrefixes,
          },
        },
      });

      deliveryZoneId = zone?.id;
    }

    // If this is set as default, unset other defaults
    if (dto.isDefault) {
      await this.prisma.address.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false },
      });
    }

    const address = await this.prisma.address.create({
      data: {
        userId,
        label: dto.label,
        line1: dto.line1,
        line2: dto.line2,
        city: dto.city,
        county: dto.county,
        postcode: dto.postcode,
        country: dto.country || 'GB',
        isDefault: dto.isDefault || false,
        deliveryZoneId,
      },
      include: {
        deliveryZone: {
          select: {
            id: true,
            name: true,
            deliveryFee: true,
          },
        },
      },
    });

    return address;
  }

  async updateAddress(userId: string, addressId: string, dto: UpdateAddressDto) {
    const address = await this.prisma.address.findFirst({
      where: { id: addressId, userId },
    });

    if (!address) {
      throw new NotFoundException('Address not found');
    }

    // If this is set as default, unset other defaults
    if (dto.isDefault) {
      await this.prisma.address.updateMany({
        where: { userId, isDefault: true, id: { not: addressId } },
        data: { isDefault: false },
      });
    }

    // Update delivery zone if postcode changed
    let deliveryZoneId = address.deliveryZoneId;
    if (dto.postcode && dto.postcode !== address.postcode) {
      const normalizedPostcode = dto.postcode.replace(/\s/g, '').toUpperCase();
      const areaMatch = normalizedPostcode.match(/^([A-Z]{1,2})(\d{1,2})/);
      
      if (areaMatch) {
        const letters = areaMatch[1];
        const digits = areaMatch[2];
        const possiblePrefixes = [
          `${letters}${digits}`,
          digits.length === 2 ? `${letters}${digits[0]}` : null,
        ].filter(Boolean) as string[];

        const zone = await this.prisma.deliveryZone.findFirst({
          where: {
            isActive: true,
            postcodePrefix: {
              hasSome: possiblePrefixes,
            },
          },
        });

        deliveryZoneId = zone?.id || null;
      }
    }

    const updated = await this.prisma.address.update({
      where: { id: addressId },
      data: {
        ...dto,
        deliveryZoneId,
      },
      include: {
        deliveryZone: {
          select: {
            id: true,
            name: true,
            deliveryFee: true,
          },
        },
      },
    });

    return updated;
  }

  async deleteAddress(userId: string, addressId: string) {
    const address = await this.prisma.address.findFirst({
      where: { id: addressId, userId },
    });

    if (!address) {
      throw new NotFoundException('Address not found');
    }

    await this.prisma.address.delete({
      where: { id: addressId },
    });

    return { message: 'Address deleted successfully' };
  }

  async setDefaultAddress(userId: string, addressId: string) {
    const address = await this.prisma.address.findFirst({
      where: { id: addressId, userId },
    });

    if (!address) {
      throw new NotFoundException('Address not found');
    }

    // Unset other defaults
    await this.prisma.address.updateMany({
      where: { userId, isDefault: true },
      data: { isDefault: false },
    });

    // Set this as default
    const updated = await this.prisma.address.update({
      where: { id: addressId },
      data: { isDefault: true },
    });

    return updated;
  }
}
