import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Export happens client-side via localStorage
export async function GET() {
  return NextResponse.json({ 
    message: 'Export via Dashboard button (client-side)' 
  });
}
