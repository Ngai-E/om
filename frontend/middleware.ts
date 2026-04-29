import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Auth is handled entirely on the client (token lives in localStorage, which
// is invisible to edge middleware). Each protected page (`/admin`, `/staff`,
// `/account`, `/platform/(console)`) redirects via `useAuthStore` when the
// user isn't authenticated. Doing it here too — and reading from a cookie
// that we never write — caused every authenticated request to /admin to be
// bounced to /login.
//
// If we ever move tokens to cookies (for SSR-aware auth), this middleware
// can be reinstated.

export function middleware(_request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  // No matcher — the middleware is effectively disabled.
  matcher: [],
};
