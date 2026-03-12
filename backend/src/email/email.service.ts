import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import { SettingsService } from '../settings/settings.service';

@Injectable()
export class EmailService {
  private resend: Resend;
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
      this.resend = new Resend(apiKey);
      console.log('✅ Email service enabled');
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

      await this.resend.emails.send({
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

      await this.resend.emails.send({
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
}
