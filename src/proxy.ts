import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const AUTH_COOKIE_NAME = 'smartstock_auth_token';

// Paths that do not require authentication
const PUBLIC_PATHS = ['/login', '/register'];

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;

  const isPublicPath = PUBLIC_PATHS.some(
    (path) => pathname === path || pathname.startsWith(path + '/')
  );

  // If user is accessing a protected route without a token
  if (!token && !isPublicPath) {
    const targetUrl = encodeURIComponent(pathname + search);
    const loginUrl = new URL(`/login?redirect=${targetUrl}`, request.url);
    return NextResponse.redirect(loginUrl);
  }

  // If user already has a token and tries to access login or register
  if (token && isPublicPath) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export default proxy;

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * 1. /api/* (API routes if any)
     * 2. /_next/static (static chunks/scripts)
     * 3. /_next/image (image optimization files)
     * 4. /images/*, /favicon.ico, and static assets (.png, .jpg, .svg, etc.)
     */
    '/((?!api|_next/static|_next/image|images|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|woff2?|ico)$).*)',
  ],
};
