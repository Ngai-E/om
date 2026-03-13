import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GuestCheckoutDto } from './dto/guest-checkout.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class GuestCheckoutService {
  constructor(private prisma: PrismaService) {}

  /**
   * Find or create a guest user based on email or phone
   * This allows returning customers to reuse their information
   */
  async findOrCreateGuestUser(dto: GuestCheckoutDto) {
    // Try to find existing user by email or phone
    let user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: dto.email },
          { phone: dto.phone },
        ],
      },
      include: {
        addresses: {
          orderBy: { isDefault: 'desc' },
        },
      },
    });

    // If user exists and is NOT a guest (has password and not guest), they're a registered user
    if (user && user.password && !user.isGuest) {
      throw new BadRequestException(
        'An account with this email/phone already exists. Please log in.',
      );
    }

    // If guest user exists, update their info but KEEP them as guest
    if (user && user.isGuest) {
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: {
          firstName: dto.firstName,
          lastName: dto.lastName,
          phone: dto.phone,
          email: dto.email,
          isGuest: true, // Keep as guest
          emailVerified: false, // Guests don't need verification
        },
        include: {
          addresses: {
            orderBy: { isDefault: 'desc' },
          },
        },
      });

      console.log(`🔄 Updated guest user: ${user.email}`);
    } else {
      // Create new GUEST user (no password)
      user = await this.prisma.user.create({
        data: {
          email: dto.email,
          firstName: dto.firstName,
          lastName: dto.lastName,
          phone: dto.phone,
          password: null, // No password for guests
          isGuest: true, // Create as guest
          emailVerified: false, // Guests don't need verification
          role: 'CUSTOMER',
        },
        include: {
          addresses: true,
        },
      });

      console.log(`👤 Created new guest user: ${user.email}`);
    }

    // Check if address already exists
    const existingAddress = user.addresses.find(
      (addr) =>
        addr.line1 === dto.addressLine1 &&
        addr.postcode === dto.postalCode,
    );

    let address;
    if (existingAddress) {
      address = existingAddress;
      console.log(`📍 Using existing address for guest user`);
    } else {
      // Create new address
      address = await this.prisma.address.create({
        data: {
          userId: user.id,
          line1: dto.addressLine1,
          line2: dto.addressLine2,
          city: dto.city,
          county: dto.state,
          postcode: dto.postalCode,
          country: dto.country || 'GB',
          isDefault: user.addresses.length === 0, // First address is default
        },
      });

      console.log(`📍 Created new address for guest user`);
    }

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        isGuest: user.isGuest,
        addresses: user.addresses,
      },
      address,
    };
  }

  /**
   * Convert a guest user to a registered user
   */
  async convertGuestToRegistered(userId: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (!user.isGuest) {
      throw new BadRequestException('User is already registered');
    }

    // Hash password (you'll need to import bcrypt)
    const bcrypt = require('bcrypt');
    const hashedPassword = await bcrypt.hash(password, 10);

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
        isGuest: false,
        emailVerified: true,
      },
    });

    console.log(`✅ Converted guest user to registered: ${updatedUser.email}`);

    return updatedUser;
  }

  /**
   * Get guest user addresses
   */
  async getGuestAddresses(email: string, phone: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [{ email }, { phone }],
        isGuest: true,
      },
      include: {
        addresses: {
          orderBy: { isDefault: 'desc' },
        },
      },
    });

    return user?.addresses || [];
  }
}
