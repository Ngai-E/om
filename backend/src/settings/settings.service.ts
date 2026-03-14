import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export enum PaymentMethod {
  STRIPE_CHECKOUT = 'stripe_checkout',
  STRIPE_ELEMENTS = 'stripe_elements',
}

export enum PaymentType {
  CARD = 'card',
  CASH_ON_DELIVERY = 'cash_on_delivery',
  PAY_IN_STORE = 'pay_in_store',
}

export enum ImageUploadService {
  IMGBB = 'imgbb',
  CLOUDINARY = 'cloudinary',
}

export interface PaymentMethodsConfig {
  card: {
    enabled: boolean;
    method: PaymentMethod; // stripe_checkout or stripe_elements
  };
  cashOnDelivery: {
    enabled: boolean;
  };
  payInStore: {
    enabled: boolean;
  };
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

  async getPaymentMethodsConfig(): Promise<PaymentMethodsConfig> {
    const config = await this.getSetting('payment_methods_config');
    
    if (config) {
      try {
        return JSON.parse(config);
      } catch (error) {
        console.error('Failed to parse payment methods config:', error);
      }
    }
    
    // Default configuration
    return {
      card: {
        enabled: true,
        method: PaymentMethod.STRIPE_CHECKOUT,
      },
      cashOnDelivery: {
        enabled: true,
      },
      payInStore: {
        enabled: true,
      },
    };
  }

  async setPaymentMethodsConfig(config: PaymentMethodsConfig, updatedBy?: string): Promise<void> {
    await this.setSetting(
      'payment_methods_config',
      JSON.stringify(config),
      'Configuration for enabled payment methods',
      updatedBy,
    );
  }

  async getEnabledPaymentTypes(): Promise<PaymentType[]> {
    const config = await this.getPaymentMethodsConfig();
    const enabled: PaymentType[] = [];

    if (config.card.enabled) {
      enabled.push(PaymentType.CARD);
    }
    if (config.cashOnDelivery.enabled) {
      enabled.push(PaymentType.CASH_ON_DELIVERY);
    }
    if (config.payInStore.enabled) {
      enabled.push(PaymentType.PAY_IN_STORE);
    }

    return enabled;
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

  async getGuestCheckoutEnabled(): Promise<boolean> {
    const enabled = await this.getSetting('guest_checkout_enabled');
    return enabled === 'true' || enabled === null; // Default to true
  }

  async setGuestCheckoutEnabled(enabled: boolean, updatedBy?: string): Promise<void> {
    await this.setSetting(
      'guest_checkout_enabled',
      enabled.toString(),
      'Allow customers to checkout without creating an account',
      updatedBy,
    );
  }

  async getEmailNotificationsEnabled(): Promise<boolean> {
    const enabled = await this.getSetting('email_notifications_enabled');
    return enabled === 'true' || enabled === null; // Default to true
  }

  async setEmailNotificationsEnabled(enabled: boolean, updatedBy?: string): Promise<void> {
    await this.setSetting(
      'email_notifications_enabled',
      enabled.toString(),
      'Send email notifications to customers for order updates',
      updatedBy,
    );
  }

  async getAllowImageUpload(): Promise<boolean> {
    const enabled = await this.getSetting('allow_image_upload');
    return enabled === 'true' || enabled === null; // Default to true
  }

  async setAllowImageUpload(enabled: boolean, updatedBy?: string): Promise<void> {
    await this.setSetting(
      'allow_image_upload',
      enabled.toString(),
      'Allow users to upload images for products',
      updatedBy,
    );
  }

  async getAllowImageLink(): Promise<boolean> {
    const enabled = await this.getSetting('allow_image_link');
    return enabled === 'true' || enabled === null; // Default to true
  }

  async setAllowImageLink(enabled: boolean, updatedBy?: string): Promise<void> {
    await this.setSetting(
      'allow_image_link',
      enabled.toString(),
      'Allow users to insert image links for products',
      updatedBy,
    );
  }

  async getImageUploadService(): Promise<ImageUploadService> {
    const service = await this.getSetting('image_upload_service');
    return (service as ImageUploadService) || ImageUploadService.IMGBB;
  }

  async setImageUploadService(service: ImageUploadService, updatedBy?: string): Promise<void> {
    await this.setSetting(
      'image_upload_service',
      service,
      'Image upload service (imgbb or cloudinary)',
      updatedBy,
    );
  }

  async getImgbbApiKey(): Promise<string | null> {
    return await this.getSetting('imgbb_api_key');
  }

  async setImgbbApiKey(apiKey: string, updatedBy?: string): Promise<void> {
    await this.setSetting(
      'imgbb_api_key',
      apiKey,
      'ImgBB API key for image uploads',
      updatedBy,
    );
  }

  async getCloudinaryConfig(): Promise<{ cloudName: string; apiKey: string; apiSecret: string } | null> {
    const config = await this.getSetting('cloudinary_config');
    if (config) {
      try {
        return JSON.parse(config);
      } catch (error) {
        console.error('Failed to parse Cloudinary config:', error);
      }
    }
    return null;
  }

  async setCloudinaryConfig(config: { cloudName: string; apiKey: string; apiSecret: string }, updatedBy?: string): Promise<void> {
    await this.setSetting(
      'cloudinary_config',
      JSON.stringify(config),
      'Cloudinary configuration for image uploads',
      updatedBy,
    );
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
      {
        key: 'guest_checkout_enabled',
        value: 'true',
        description: 'Allow customers to checkout without creating an account',
      },
      {
        key: 'email_notifications_enabled',
        value: 'true',
        description: 'Send email notifications to customers for order updates',
      },
      {
        key: 'allow_image_upload',
        value: 'true',
        description: 'Allow users to upload images for products',
      },
      {
        key: 'allow_image_link',
        value: 'true',
        description: 'Allow users to insert image links for products',
      },
      {
        key: 'image_upload_service',
        value: ImageUploadService.IMGBB,
        description: 'Image upload service (imgbb or cloudinary)',
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
