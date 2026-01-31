import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// No-op - data is in localStorage on client-side
export async function GET() {
  return NextResponse.json({ 
    visitor: null, 
    pageViews: [] 
  });
}
