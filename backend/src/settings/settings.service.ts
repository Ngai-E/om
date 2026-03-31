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

  async getSetting(key: string, tenantId?: string): Promise<string | null> {
    const setting = await this.prisma.systemSettings.findFirst({
      where: { key, ...(tenantId && { tenantId }) },
    });
    return setting?.value || null;
  }

  async setSetting(key: string, value: string, description?: string, updatedBy?: string, tenantId?: string): Promise<void> {
    const existing = await this.prisma.systemSettings.findFirst({
      where: { key, ...(tenantId && { tenantId }) },
    });

    if (existing) {
      await this.prisma.systemSettings.update({
        where: { id: existing.id },
        data: { value, description, updatedBy },
      });
    } else {
      await this.prisma.systemSettings.create({
        data: { key, value, description, updatedBy, ...(tenantId && { tenantId }) },
      });
    }
  }

  async getPaymentMethod(tenantId?: string): Promise<PaymentMethod> {
    const method = await this.getSetting('payment_method', tenantId);
    return (method as PaymentMethod) || PaymentMethod.STRIPE_CHECKOUT;
  }

  async setPaymentMethod(method: PaymentMethod, updatedBy?: string, tenantId?: string): Promise<void> {
    await this.setSetting(
      'payment_method',
      method,
      'Payment processing method for checkout',
      updatedBy,
      tenantId,
    );
  }

  async getPaymentMethodsConfig(tenantId?: string): Promise<PaymentMethodsConfig> {
    const config = await this.getSetting('payment_methods_config', tenantId);
    
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

  // Social Proof Settings
  async getProductOrdersInflation(tenantId?: string): Promise<number> {
    const value = await this.getSetting('product_orders_inflation', tenantId);
    return value ? parseFloat(value) : 1.0;
  }

  async setProductOrdersInflation(multiplier: number, updatedBy?: string, tenantId?: string): Promise<void> {
    await this.setSetting(
      'product_orders_inflation',
      multiplier.toString(),
      'Global multiplier for product order count display (e.g., 2.5 = show 2.5x actual orders)',
      updatedBy,
      tenantId,
    );
  }

  async getPromotionUsageInflation(tenantId?: string): Promise<number> {
    const value = await this.getSetting('promotion_usage_inflation', tenantId);
    return value ? parseFloat(value) : 1.0;
  }

  async setPromotionUsageInflation(multiplier: number, updatedBy?: string, tenantId?: string): Promise<void> {
    await this.setSetting(
      'promotion_usage_inflation',
      multiplier.toString(),
      'Global multiplier for promotion usage count display (e.g., 3.0 = show 3x actual usage)',
      updatedBy,
      tenantId,
    );
  }

  async getShowProductOrderBadges(tenantId?: string): Promise<boolean> {
    const value = await this.getSetting('show_product_order_badges', tenantId);
    return value === 'true';
  }

  async setShowProductOrderBadges(enabled: boolean, updatedBy?: string, tenantId?: string): Promise<void> {
    await this.setSetting(
      'show_product_order_badges',
      enabled.toString(),
      'Global toggle to show/hide order count badges on all product cards',
      updatedBy,
      tenantId,
    );
  }

  async getShowPromotionUsageBadges(tenantId?: string): Promise<boolean> {
    const value = await this.getSetting('show_promotion_usage_badges', tenantId);
    return value === 'true';
  }

  async setShowPromotionUsageBadges(enabled: boolean, updatedBy?: string, tenantId?: string): Promise<void> {
    await this.setSetting(
      'show_promotion_usage_badges',
      enabled.toString(),
      'Global toggle to show/hide usage count badges on all promotion cards',
      updatedBy,
      tenantId,
    );
  }

  async setPaymentMethodsConfig(config: PaymentMethodsConfig, updatedBy?: string, tenantId?: string): Promise<void> {
    await this.setSetting(
      'payment_methods_config',
      JSON.stringify(config),
      'Configuration for enabled payment methods',
      updatedBy,
      tenantId,
    );
  }

  async getEnabledPaymentTypes(tenantId?: string): Promise<PaymentType[]> {
    const config = await this.getPaymentMethodsConfig(tenantId);
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

  async getAllSettings(tenantId?: string): Promise<Record<string, any>> {
    const where: any = tenantId ? { tenantId } : {};
    const settings = await this.prisma.systemSettings.findMany({ where });
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

  async getGuestCheckoutEnabled(tenantId?: string): Promise<boolean> {
    const enabled = await this.getSetting('guest_checkout_enabled', tenantId);
    return enabled === 'true' || enabled === null; // Default to true
  }

  async setGuestCheckoutEnabled(enabled: boolean, updatedBy?: string, tenantId?: string): Promise<void> {
    await this.setSetting(
      'guest_checkout_enabled',
      enabled.toString(),
      'Allow customers to checkout without creating an account',
      updatedBy,
      tenantId,
    );
  }

  async getEmailNotificationsEnabled(tenantId?: string): Promise<boolean> {
    const enabled = await this.getSetting('email_notifications_enabled', tenantId);
    return enabled === 'true' || enabled === null; // Default to true
  }

  async setEmailNotificationsEnabled(enabled: boolean, updatedBy?: string, tenantId?: string): Promise<void> {
    await this.setSetting(
      'email_notifications_enabled',
      enabled.toString(),
      'Send email notifications to customers for order updates',
      updatedBy,
      tenantId,
    );
  }

  async getAllowImageUpload(tenantId?: string): Promise<boolean> {
    const enabled = await this.getSetting('allow_image_upload', tenantId);
    return enabled === 'true' || enabled === null; // Default to true
  }

  async setAllowImageUpload(enabled: boolean, updatedBy?: string, tenantId?: string): Promise<void> {
    await this.setSetting(
      'allow_image_upload',
      enabled.toString(),
      'Allow users to upload images for products',
      updatedBy,
      tenantId,
    );
  }

  async getAllowImageLink(tenantId?: string): Promise<boolean> {
    const enabled = await this.getSetting('allow_image_link', tenantId);
    return enabled === 'true' || enabled === null; // Default to true
  }

  async setAllowImageLink(enabled: boolean, updatedBy?: string, tenantId?: string): Promise<void> {
    await this.setSetting(
      'allow_image_link',
      enabled.toString(),
      'Allow users to insert image links for products',
      updatedBy,
      tenantId,
    );
  }

  async getImageUploadService(tenantId?: string): Promise<ImageUploadService> {
    const service = await this.getSetting('image_upload_service', tenantId);
    return (service as ImageUploadService) || ImageUploadService.IMGBB;
  }

  async setImageUploadService(service: ImageUploadService, updatedBy?: string, tenantId?: string): Promise<void> {
    await this.setSetting(
      'image_upload_service',
      service,
      'Image upload service (imgbb or cloudinary)',
      updatedBy,
      tenantId,
    );
  }

  async getImgbbApiKey(tenantId?: string): Promise<string | null> {
    return await this.getSetting('imgbb_api_key', tenantId);
  }

  async setImgbbApiKey(apiKey: string, updatedBy?: string, tenantId?: string): Promise<void> {
    await this.setSetting(
      'imgbb_api_key',
      apiKey,
      'ImgBB API key for image uploads',
      updatedBy,
      tenantId,
    );
  }

  async getCloudinaryConfig(tenantId?: string): Promise<{ cloudName: string; apiKey: string; apiSecret: string } | null> {
    const config = await this.getSetting('cloudinary_config', tenantId);
    if (config) {
      try {
        return JSON.parse(config);
      } catch (error) {
        console.error('Failed to parse Cloudinary config:', error);
      }
    }
    return null;
  }

  async setCloudinaryConfig(config: { cloudName: string; apiKey: string; apiSecret: string }, updatedBy?: string, tenantId?: string): Promise<void> {
    await this.setSetting(
      'cloudinary_config',
      JSON.stringify(config),
      'Cloudinary configuration for image uploads',
      updatedBy,
      tenantId,
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
