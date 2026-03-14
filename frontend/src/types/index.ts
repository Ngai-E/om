// User types
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: 'CUSTOMER' | 'STAFF' | 'ADMIN';
  emailVerified: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  accessToken: string;
  user: User;
}

// Product types
export interface Product {
  id: string;
  name: string;
  slug: string;
  description?: string;
  price: string;
  compareAtPrice?: string;
  categoryId: string;
  category: Category;
  isActive: boolean;
  isFeatured: boolean;
  tags: string[];
  images: ProductImage[];
  inventory?: Inventory;
  variants?: ProductVariant[];
  createdAt: string;
  updatedAt: string;
}

export interface ProductVariant {
  id: string;
  productId: string;
  name: string;
  sku?: string;
  price: string;
  compareAtPrice?: string;
  stock: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductImage {
  id: string;
  url: string;
  altText?: string;
  sortOrder: number;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
}

export interface Inventory {
  id: string;
  productId: string;
  quantity: number;
  lowStockThreshold: number;
  isTracked: boolean;
}

// Cart types
export interface Cart {
  id: string;
  userId?: string;
  items: CartItem[];
  subtotal: number;
  itemCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CartItem {
  id: string;
  cartId: string;
  productId: string;
  product: Product;
  variantId?: string;
  variant?: ProductVariant;
  quantity: number;
  createdAt: string;
  updatedAt: string;
}

// Order types
export interface Order {
  id: string;
  orderNumber: string;
  userId?: string;
  user?: User;
  status: OrderStatus;
  fulfillmentType: 'DELIVERY' | 'COLLECTION';
  paymentMethod?: 'CARD' | 'CASH_ON_DELIVERY' | 'PAY_IN_STORE';
  subtotal: string;
  deliveryFee: string;
  total: string;
  notes?: string;
  items: OrderItem[];
  address?: Address;
  deliverySlot?: DeliverySlot;
  payment?: Payment;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  product: Product;
  productName: string;
  productPrice: string;
  quantity: number;
  subtotal: string;
}

export type OrderStatus =
  | 'RECEIVED'
  | 'PICKING'
  | 'PACKED'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'READY_FOR_COLLECTION'
  | 'COLLECTED'
  | 'CANCELLED'
  | 'REFUNDED';

// Address types
export interface Address {
  id: string;
  userId: string;
  label?: string;
  line1: string;
  line2?: string;
  city: string;
  county?: string;
  postcode: string;
  country: string;
  isDefault: boolean;
  deliveryZone?: DeliveryZone;
  createdAt: string;
  updatedAt: string;
}

// Delivery types
export interface DeliveryZone {
  id: string;
  name: string;
  postcodePrefix: string[];
  deliveryFee: string;
  minOrderValue: string;
  freeDeliveryThreshold?: string;
}

export interface DeliverySlot {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  capacity: number;
  currentOrders: number;
  available: boolean;
  displayTime: string;
}

// Payment types
export interface Payment {
  id: string;
  orderId: string;
  stripePaymentIntentId?: string;
  amount: string;
  currency: string;
  status: PaymentStatus;
  paymentMethod: PaymentMethod;
  paidAt?: string;
  createdAt: string;
}

export type PaymentStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'SUCCEEDED'
  | 'FAILED'
  | 'CANCELLED'
  | 'REFUNDED'
  | 'PARTIALLY_REFUNDED';

export type PaymentMethod =
  | 'CARD'
  | 'APPLE_PAY'
  | 'GOOGLE_PAY'
  | 'CASH_ON_DELIVERY'
  | 'PAY_IN_STORE';

// API Response types
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiError {
  message: string;
  statusCode: number;
  error?: string;
}
