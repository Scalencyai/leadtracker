import { NextRequest, NextResponse } from 'next/server';
import { getVisitorsWithStats } from '@/lib/db';

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

    // Generate CSV
    const headers = ['Company Name', 'Country', 'City', 'First Seen', 'Last Seen', 'Total Visits', 'Pages Viewed'];
    const rows = visitors.map(v => [
      v.company_name || 'Unknown Company',
      v.country || '',
      v.city || '',
      new Date(v.first_seen).toISOString(),
      new Date(v.last_seen).toISOString(),
      v.total_visits.toString(),
      v.pages_viewed.join('; '),
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(',')),
    ].join('\n');

    const filename = `leadtracker_${new Date().toISOString().split('T')[0]}.csv`;

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Export API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
