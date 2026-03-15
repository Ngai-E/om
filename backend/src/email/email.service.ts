import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { SettingsService } from '../settings/settings.service';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;
  private fromEmail: string;
  private isEnabled: boolean;

  constructor(
    private config: ConfigService,
    private settingsService: SettingsService,
  ) {
    const apiKey = config.get('RESEND_API_KEY');
    this.fromEmail = config.get('FROM_EMAIL') || 'orders@omegaafro.com';
    this.isEnabled = !!apiKey;

    if (this.isEnabled) {
      // Configure Resend SMTP
      this.transporter = nodemailer.createTransport({
        host: 'smtp.resend.com',
        port: 465,
        secure: true, // use SSL
        auth: {
          user: 'resend',
          pass: apiKey,
        },
      });
      console.log('✅ Email service enabled (Resend SMTP)');
    } else {
      console.log('⚠️  Email service disabled (no RESEND_API_KEY)');
    }
  }

  async sendOrderConfirmation(order: any) {
    // Check if email notifications are enabled in settings
    const emailNotificationsEnabled = await this.settingsService.getEmailNotificationsEnabled();
    
    if (!emailNotificationsEnabled) {
      console.log('📧 Email notifications disabled in settings');
      return;
    }

    if (!this.isEnabled) {
      console.log('📧 Email disabled - would have sent order confirmation');
      return;
    }

    try {
      const itemsList = order.items
        .map(
          (item: any) =>
            `<li>${item.quantity}x ${item.productName}${item.variantName ? ` (${item.variantName})` : ''} - £${parseFloat(item.subtotal).toFixed(2)}</li>`,
        )
        .join('');

      const deliveryInfo =
        order.fulfillmentType === 'DELIVERY' && order.address
          ? `
        <div style="margin: 20px 0; padding: 15px; background-color: #f3f4f6; border-radius: 8px;">
          <h3 style="margin: 0 0 10px 0; color: #374151;">Delivery Address</h3>
          <p style="margin: 0; color: #6b7280;">
            ${order.address.line1}<br>
            ${order.address.line2 ? `${order.address.line2}<br>` : ''}
            ${order.address.city}, ${order.address.postcode}
          </p>
          ${
            order.deliverySlot
              ? `
          <h3 style="margin: 15px 0 10px 0; color: #374151;">Delivery Time</h3>
          <p style="margin: 0; color: #6b7280;">
            ${new Date(order.deliverySlot.date).toLocaleDateString('en-GB')}<br>
            ${order.deliverySlot.startTime} - ${order.deliverySlot.endTime}
          </p>
          `
              : ''
          }
        </div>
      `
          : `
        <div style="margin: 20px 0; padding: 15px; background-color: #f3f4f6; border-radius: 8px;">
          <h3 style="margin: 0 0 10px 0; color: #374151;">Collection</h3>
          <p style="margin: 0; color: #6b7280;">Pick up in store</p>
        </div>
      `;

      await this.transporter.sendMail({
        from: this.fromEmail,
        to: order.user.email,
        subject: `Order Confirmation - ${order.orderNumber}`,
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #16a34a; margin: 0;">OMEGA Afro Caribbean Superstore</h1>
                <p style="color: #6b7280; margin: 5px 0;">Your one-stop shop for authentic African and Caribbean groceries</p>
              </div>

              <div style="background-color: #dcfce7; border-left: 4px solid #16a34a; padding: 15px; margin-bottom: 20px;">
                <h2 style="margin: 0 0 10px 0; color: #15803d;">Order Confirmed!</h2>
                <p style="margin: 0; color: #166534;">Thank you for your order. We've received it and will process it shortly.</p>
              </div>

              <div style="margin: 20px 0;">
                <p style="margin: 0; color: #6b7280;">Order Number</p>
                <p style="margin: 5px 0 0 0; font-size: 18px; font-weight: bold; color: #111827;">${order.orderNumber}</p>
              </div>

              ${deliveryInfo}

              <div style="margin: 20px 0;">
                <h3 style="margin: 0 0 15px 0; color: #374151;">Order Items</h3>
                <ul style="list-style: none; padding: 0; margin: 0;">
                  ${itemsList}
                </ul>
              </div>

              <div style="margin: 20px 0; padding: 15px; background-color: #f9fafb; border-radius: 8px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                  <span style="color: #6b7280;">Subtotal</span>
                  <span style="color: #111827; font-weight: 600;">£${parseFloat(order.subtotal).toFixed(2)}</span>
                </div>
                ${
                  order.deliveryFee && parseFloat(order.deliveryFee) > 0
                    ? `
                <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                  <span style="color: #6b7280;">Delivery Fee</span>
                  <span style="color: #111827; font-weight: 600;">£${parseFloat(order.deliveryFee).toFixed(2)}</span>
                </div>
                `
                    : ''
                }
                <div style="display: flex; justify-content: space-between; padding-top: 10px; border-top: 2px solid #e5e7eb;">
                  <span style="color: #111827; font-weight: bold; font-size: 18px;">Total</span>
                  <span style="color: #16a34a; font-weight: bold; font-size: 18px;">£${parseFloat(order.total).toFixed(2)}</span>
                </div>
              </div>

              <div style="margin: 30px 0; padding: 15px; background-color: #eff6ff; border-radius: 8px; text-align: center;">
                <p style="margin: 0; color: #1e40af;">We'll send you another email when your order is ready for ${order.fulfillmentType === 'DELIVERY' ? 'delivery' : 'collection'}.</p>
              </div>

              <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 14px;">
                <p>Thank you for shopping with us!</p>
                <p>For support, contact us at <a href="mailto:support@omegaafro.com" style="color: #16a34a;">support@omegaafro.com</a></p>
              </div>
            </body>
          </html>
        `,
      });

      console.log(`📧 Order confirmation email sent to ${order.user.email}`);
    } catch (error) {
      console.error('Failed to send order confirmation email:', error);
      // Don't throw - email failure shouldn't break order creation
    }
  }

  async sendOrderStatusUpdate(order: any, newStatus: string) {
    // Check if email notifications are enabled in settings
    const emailNotificationsEnabled = await this.settingsService.getEmailNotificationsEnabled();
    
    if (!emailNotificationsEnabled) {
      console.log('📧 Email notifications disabled in settings');
      return;
    }

    if (!this.isEnabled) {
      console.log('📧 Email disabled - would have sent status update');
      return;
    }

    try {
      const statusMessages = {
        PICKING: 'Your order is being prepared',
        READY_FOR_DELIVERY: 'Your order is ready for delivery',
        OUT_FOR_DELIVERY: 'Your order is out for delivery',
        DELIVERED: 'Your order has been delivered',
        READY_FOR_COLLECTION: 'Your order is ready for collection',
        COLLECTED: 'Your order has been collected',
      };

      const message = statusMessages[newStatus] || `Your order status has been updated to ${newStatus}`;

      await this.transporter.sendMail({
        from: this.fromEmail,
        to: order.user.email,
        subject: `Order Update - ${order.orderNumber}`,
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #16a34a; margin: 0;">OMEGA Afro Caribbean Superstore</h1>
              </div>

              <div style="background-color: #dbeafe; border-left: 4px solid #3b82f6; padding: 15px; margin-bottom: 20px;">
                <h2 style="margin: 0 0 10px 0; color: #1e40af;">Order Update</h2>
                <p style="margin: 0; color: #1e3a8a;">${message}</p>
              </div>

              <div style="margin: 20px 0;">
                <p style="margin: 0; color: #6b7280;">Order Number</p>
                <p style="margin: 5px 0 0 0; font-size: 18px; font-weight: bold; color: #111827;">${order.orderNumber}</p>
              </div>

              <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 14px;">
                <p>Thank you for shopping with us!</p>
              </div>
            </body>
          </html>
        `,
      });

      console.log(`📧 Status update email sent to ${order.user.email}`);
    } catch (error) {
      console.error('Failed to send status update email:', error);
    }
  }

  async sendPromotionEarned(user: any, promotion: any) {
    if (!this.isEnabled) return;

    const emailNotificationsEnabled = await this.settingsService.getEmailNotificationsEnabled();
    if (!emailNotificationsEnabled) return;

    try {
      await this.transporter.sendMail({
        from: this.fromEmail,
        to: user.email,
        subject: `🎉 You've Earned a Special Offer!`,
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                <h1 style="margin: 0; font-size: 28px;">🎉 Special Offer Unlocked!</h1>
              </div>
              
              <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
                <p style="font-size: 18px; margin-bottom: 20px;">Hi ${user.firstName},</p>
                
                <p style="font-size: 16px; margin-bottom: 25px;">
                  Great news! You've earned an exclusive promotion:
                </p>
                
                <div style="background: white; border-left: 4px solid #667eea; padding: 20px; margin: 25px 0; border-radius: 5px;">
                  <h2 style="margin: 0 0 10px 0; color: #667eea; font-size: 24px;">${promotion.name}</h2>
                  <p style="margin: 0 0 15px 0; font-size: 16px; color: #666;">${promotion.description || ''}</p>
                  
                  <div style="background: #667eea; color: white; display: inline-block; padding: 10px 20px; border-radius: 5px; font-size: 20px; font-weight: bold; margin: 10px 0;">
                    ${promotion.discountType === 'PERCENT' ? `${promotion.discountValue}% OFF` : `£${promotion.discountValue} OFF`}
                  </div>
                  
                  ${promotion.code ? `
                    <div style="margin-top: 15px; padding: 15px; background: #f0f4ff; border-radius: 5px;">
                      <p style="margin: 0 0 5px 0; font-size: 12px; color: #666; text-transform: uppercase;">Promo Code</p>
                      <p style="margin: 0; font-size: 24px; font-weight: bold; font-family: monospace; color: #667eea;">${promotion.code}</p>
                    </div>
                  ` : ''}
                </div>
                
                <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 5px;">
                  <p style="margin: 0; font-size: 14px; color: #856404;">
                    <strong>How to use:</strong><br>
                    ${promotion.code ? `Enter code <strong>${promotion.code}</strong> at checkout` : 'Discount will be applied automatically at checkout'}
                    ${promotion.minSubtotal ? `<br>Minimum order: £${promotion.minSubtotal}` : ''}
                    ${promotion.endAt ? `<br>Valid until: ${new Date(promotion.endAt).toLocaleDateString('en-GB')}` : ''}
                  </p>
                </div>
                
                <div style="text-align: center; margin-top: 30px;">
                  <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/products" 
                     style="background: #667eea; color: white; padding: 15px 40px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                    Shop Now
                  </a>
                </div>
                
                <p style="margin-top: 30px; font-size: 14px; color: #666; text-align: center;">
                  Happy shopping!<br>
                  The Omega Afro Shop Team
                </p>
              </div>
            </body>
          </html>
        `,
      });

      console.log(`📧 Promotion earned email sent to ${user.email}`);
    } catch (error) {
      console.error('Failed to send promotion earned email:', error);
    }
  }

  async sendPromotionExpiring(user: any, promotion: any, daysRemaining: number) {
    if (!this.isEnabled) return;

    const emailNotificationsEnabled = await this.settingsService.getEmailNotificationsEnabled();
    if (!emailNotificationsEnabled) return;

    try {
      await this.transporter.sendMail({
        from: this.fromEmail,
        to: user.email,
        subject: `⏰ Your ${promotion.name} Expires in ${daysRemaining} Days!`,
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                <h1 style="margin: 0; font-size: 28px;">⏰ Don't Miss Out!</h1>
              </div>
              
              <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
                <p style="font-size: 18px; margin-bottom: 20px;">Hi ${user.firstName},</p>
                
                <p style="font-size: 16px; margin-bottom: 25px;">
                  Your exclusive promotion is expiring soon!
                </p>
                
                <div style="background: white; border-left: 4px solid #f5576c; padding: 20px; margin: 25px 0; border-radius: 5px;">
                  <h2 style="margin: 0 0 10px 0; color: #f5576c; font-size: 24px;">${promotion.name}</h2>
                  <p style="margin: 0 0 15px 0; font-size: 16px; color: #666;">${promotion.description || ''}</p>
                  
                  <div style="background: #f5576c; color: white; display: inline-block; padding: 10px 20px; border-radius: 5px; font-size: 20px; font-weight: bold; margin: 10px 0;">
                    ${promotion.discountType === 'PERCENT' ? `${promotion.discountValue}% OFF` : `£${promotion.discountValue} OFF`}
                  </div>
                  
                  ${promotion.code ? `
                    <div style="margin-top: 15px; padding: 15px; background: #fff5f5; border-radius: 5px;">
                      <p style="margin: 0 0 5px 0; font-size: 12px; color: #666; text-transform: uppercase;">Promo Code</p>
                      <p style="margin: 0; font-size: 24px; font-weight: bold; font-family: monospace; color: #f5576c;">${promotion.code}</p>
                    </div>
                  ` : ''}
                </div>
                
                <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 5px;">
                  <p style="margin: 0; font-size: 16px; color: #856404;">
                    <strong>⏰ Expires in ${daysRemaining} ${daysRemaining === 1 ? 'day' : 'days'}!</strong><br>
                    ${promotion.endAt ? `Valid until: ${new Date(promotion.endAt).toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}` : ''}
                  </p>
                </div>
                
                <div style="text-align: center; margin-top: 30px;">
                  <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/products" 
                     style="background: #f5576c; color: white; padding: 15px 40px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                    Use Now Before It Expires!
                  </a>
                </div>
                
                <p style="margin-top: 30px; font-size: 14px; color: #666; text-align: center;">
                  Don't let this offer slip away!<br>
                  The Omega Afro Shop Team
                </p>
              </div>
            </body>
          </html>
        `,
      });

      console.log(`📧 Promotion expiring email sent to ${user.email}`);
    } catch (error) {
      console.error('Failed to send promotion expiring email:', error);
    }
  }
}
