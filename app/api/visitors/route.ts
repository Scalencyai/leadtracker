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

    return NextResponse.json({ 
      visitors,
      countries
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
