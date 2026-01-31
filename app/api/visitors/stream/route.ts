import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// No-op - real-time updates happen via localStorage polling on client-side
export async function GET() {
  return NextResponse.json({ 
    message: 'SSE not needed with localStorage' 
  });
}
