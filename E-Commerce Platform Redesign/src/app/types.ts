export interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  category: string;
  stock: 'in-stock' | 'low-stock' | 'out-of-stock';
  stockCount: number;
  description: string;
  variants?: ProductVariant[];
  isWishlisted?: boolean;
}

export interface ProductVariant {
  id: string;
  name: string;
  price: number;
  stockCount: number;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  productCount: number;
}

export interface CartItem {
  id: string;
  product: Product;
  quantity: number;
  selectedVariant?: ProductVariant;
}

export interface Promotion {
  id: string;
  title: string;
  description: string;
  discount: string;
  validFrom: string;
  validTo: string;
  image: string;
  code?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  date: string;
  status: 'received' | 'processing' | 'shipped' | 'delivered';
  total: number;
  items: CartItem[];
}

export type PaymentMethod = 'card' | 'apple-pay' | 'google-pay' | 'cash' | 'pay-in-store';
