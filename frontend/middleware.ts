import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Define public and authenticated routes
const publicRoutes = ['/login', '/register', '/products', '/cart', '/checkout', '/promotions', '/wishlist'];
const authRoutes = ['/account', '/admin', '/staff'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('token')?.value;

  // Check if route requires authentication
  const isAuthRoute = authRoutes.some(route => pathname.startsWith(route));
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));

  // If on authenticated route without token, redirect to login
  if (isAuthRoute && !token) {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  // If on login/register route with token, redirect to home
  if ((pathname === '/login' || pathname === '/register') && token) {
    const homeUrl = new URL('/', request.url);
    return NextResponse.redirect(homeUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api routes
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
};
