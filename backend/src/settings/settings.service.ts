import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export enum PaymentMethod {
  STRIPE_CHECKOUT = 'stripe_checkout',
  STRIPE_ELEMENTS = 'stripe_elements',
}

@Injectable()
export class SettingsService {
  constructor(private prisma: PrismaService) {}

  async getSetting(key: string): Promise<string | null> {
    const setting = await this.prisma.systemSettings.findUnique({
      where: { key },
    });
    return setting?.value || null;
  }

  async setSetting(key: string, value: string, description?: string, updatedBy?: string): Promise<void> {
    await this.prisma.systemSettings.upsert({
      where: { key },
      create: {
        key,
        value,
        description,
        updatedBy,
      },
      update: {
        value,
        description,
        updatedBy,
      },
    });
  }

  async getPaymentMethod(): Promise<PaymentMethod> {
    const method = await this.getSetting('payment_method');
    return (method as PaymentMethod) || PaymentMethod.STRIPE_CHECKOUT;
  }

  async setPaymentMethod(method: PaymentMethod, updatedBy?: string): Promise<void> {
    await this.setSetting(
      'payment_method',
      method,
      'Payment processing method for checkout',
      updatedBy,
    );
  }

  async getAllSettings(): Promise<Record<string, any>> {
    const settings = await this.prisma.systemSettings.findMany();
    const result: Record<string, any> = {};
    
    for (const setting of settings) {
      try {
        // Try to parse as JSON first
        result[setting.key] = JSON.parse(setting.value);
      } catch {
        // If not JSON, use as string
        result[setting.key] = setting.value;
      }
    }
    
    return result;
  }

  async initializeDefaults(): Promise<void> {
    const defaults = [
      {
        key: 'payment_method',
        value: PaymentMethod.STRIPE_CHECKOUT,
        description: 'Payment processing method (stripe_checkout or stripe_elements)',
      },
      {
        key: 'store_name',
        value: 'OMEGA AFRO SHOP',
        description: 'Store name displayed to customers',
      },
      {
        key: 'currency',
        value: 'GBP',
        description: 'Store currency code',
      },
    ];

    for (const setting of defaults) {
      const existing = await this.getSetting(setting.key);
      if (!existing) {
        await this.setSetting(setting.key, setting.value, setting.description);
      }
    }
  }
}
