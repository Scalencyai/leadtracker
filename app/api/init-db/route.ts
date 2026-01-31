import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

// No database - using localStorage
export async function POST() {
  return NextResponse.json({ 
    success: true,
    message: 'No database initialization needed - using localStorage'
  });
}
