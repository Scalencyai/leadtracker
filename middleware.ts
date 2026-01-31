import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const DASHBOARD_PASSWORD = 'demo123'; // Hardcoded for now

export function middleware(request: NextRequest) {
  // Only protect /dashboard route
  if (request.nextUrl.pathname.startsWith('/dashboard')) {
    const authCookie = request.cookies.get('leadtracker_auth');

    // Check if authenticated
    if (authCookie?.value === DASHBOARD_PASSWORD) {
      return NextResponse.next();
    }

    // Redirect to login
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/dashboard/:path*',
};
