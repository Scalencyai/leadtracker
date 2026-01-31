import { NextRequest, NextResponse } from 'next/server';
import { getVisitorsWithStats, getCountries } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    const filters = {
      hideBotsAndISPs: searchParams.get('hideBotsAndISPs') === 'true',
      country: searchParams.get('country') || undefined,
      search: searchParams.get('search') || undefined,
      activeOnly: searchParams.get('activeOnly') === 'true',
      dateFrom: searchParams.get('dateFrom') ? parseInt(searchParams.get('dateFrom')!) : undefined,
      dateTo: searchParams.get('dateTo') ? parseInt(searchParams.get('dateTo')!) : undefined,
    };

    const visitors = await getVisitorsWithStats(filters);
    const countries = await getCountries();

    return NextResponse.json({ visitors, countries });
  } catch (error) {
    console.error('Visitors API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
