import { NextResponse } from 'next/server';
import { getVisitorsWithStats, getCountries } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  try {
    // Get visitors with stats from DB
    const visitors = await getVisitorsWithStats();
    
    // Get unique countries from DB
    const countries = await getCountries();

    // Anti-caching headers for realtime updates
    return NextResponse.json({ 
      visitors,
      countries
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  } catch (error: any) {
    console.error('Visitors API error:', error);
    return NextResponse.json({ 
      error: error.message,
      visitors: [],
      countries: []
    }, { status: 500 });
  }
}
