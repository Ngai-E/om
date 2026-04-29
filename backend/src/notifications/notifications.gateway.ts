import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://172.20.10.6:3000',
      'https://www.omegaafro.com',
      'https://omegaafro.com',
      'https://sales.omegaafro.com',
      process.env.FRONTEND_URL,
    ].filter(Boolean),
    credentials: true,
  },
  namespace: '/notifications',
})
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private adminClients: Set<string> = new Set();
  private staffClients: Set<string> = new Set();

  handleConnection(client: Socket) {
    console.log(`🔌 Client connected: ${client.id}`);
    
    // Get user role from handshake query
    const role = client.handshake.query.role as string;
    
    if (role === 'ADMIN') {
      this.adminClients.add(client.id);
      console.log(`👑 Admin connected: ${client.id}`);
    } else if (role === 'STAFF') {
      this.staffClients.add(client.id);
      console.log(`👤 Staff connected: ${client.id}`);
    }
  }

  handleDisconnect(client: Socket) {
    console.log(`🔌 Client disconnected: ${client.id}`);
    this.adminClients.delete(client.id);
    this.staffClients.delete(client.id);
  }

  // Emit new order notification to all admin and staff
  notifyNewOrder(order: any) {
    console.log(`🔔 Broadcasting new order notification: ${order.orderNumber}`);
    
    this.server.emit('new-order', {
      type: 'NEW_ORDER',
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        total: order.total,
        customerName: order.user?.name || 'Guest',
        fulfillmentType: order.fulfillmentType,
        createdAt: order.createdAt,
      },
      timestamp: new Date().toISOString(),
    });
  }

  // Emit order status update
  notifyOrderStatusUpdate(order: any) {
    console.log(`📦 Broadcasting order status update: ${order.orderNumber}`);
    
    this.server.emit('order-status-update', {
      type: 'ORDER_STATUS_UPDATE',
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
      },
      timestamp: new Date().toISOString(),
    });
  }

  // Emit payment confirmation
  notifyPaymentConfirmed(payment: any) {
    console.log(`💰 Broadcasting payment confirmation: ${payment.orderId}`);
    
    this.server.emit('payment-confirmed', {
      type: 'PAYMENT_CONFIRMED',
      payment: {
        orderId: payment.orderId,
        amount: payment.amount,
        status: payment.status,
      },
      timestamp: new Date().toISOString(),
    });
  }

  // Get connected clients count
  getConnectedClients() {
    return {
      total: this.adminClients.size + this.staffClients.size,
      admins: this.adminClients.size,
      staff: this.staffClients.size,
    };
  }
}
