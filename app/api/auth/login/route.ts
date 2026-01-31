import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

const DASHBOARD_PASSWORD = 'demo123'; // Hardcoded for now

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json();

    if (password === DASHBOARD_PASSWORD) {
      const response = NextResponse.json({ success: true });
      
      // Set auth cookie
      response.cookies.set('leadtracker_auth', DASHBOARD_PASSWORD, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: '/',
      });

      return response;
    }

    return NextResponse.json(
      { success: false, error: 'Invalid password' },
      { status: 401 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Server error' },
      { status: 500 }
    );
  }
}
