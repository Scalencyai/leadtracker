import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Only protect /dashboard route
  if (request.nextUrl.pathname.startsWith('/dashboard')) {
    const authCookie = request.cookies.get('leadtracker_auth');
    const password = process.env.DASHBOARD_PASSWORD || 'demo123';

    // Check if authenticated
    if (authCookie?.value === password) {
      return NextResponse.next();
    }

    // Check for password in query (simple auth)
    const urlPassword = request.nextUrl.searchParams.get('password');
    if (urlPassword === password) {
      const response = NextResponse.next();
      response.cookies.set('leadtracker_auth', password, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 60 * 60 * 24 * 7, // 7 days
      });
      return response;
    }

    // Redirect to login
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/dashboard/:path*',
};
