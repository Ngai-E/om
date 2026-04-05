import { createBrowserRouter } from 'react-router';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { Products } from './pages/Products';
import { ProductDetail } from './pages/ProductDetail';
import { Wishlist } from './pages/Wishlist';
import { Cart } from './pages/Cart';
import { Promotions } from './pages/Promotions';
import { OrderHistory } from './pages/OrderHistory';
import { Checkout } from './pages/Checkout';
import { NotFound } from './pages/NotFound';

export const router = createBrowserRouter([
  {
    path: '/',
    Component: Layout,
    children: [
      { index: true, Component: Home },
      { path: 'products', Component: Products },
      { path: 'product/:id', Component: ProductDetail },
      { path: 'wishlist', Component: Wishlist },
      { path: 'cart', Component: Cart },
      { path: 'promotions', Component: Promotions },
      { path: 'orders', Component: OrderHistory },
      { path: 'checkout', Component: Checkout },
      { path: '*', Component: NotFound },
    ],
  },
]);