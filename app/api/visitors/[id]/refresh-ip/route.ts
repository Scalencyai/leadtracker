import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { lookupIP } from '@/lib/ip-lookup';
import { updateVisitorLookup } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const visitorId = parseInt(params.id);
    
    if (isNaN(visitorId)) {
      return NextResponse.json(
        { error: 'Invalid visitor ID' },
        { status: 400 }
      );
    }

    // Get visitor
    const result = await sql`
      SELECT * FROM visitors WHERE id = ${visitorId}
    `;

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Visitor not found' },
        { status: 404 }
      );
    }

    const visitor = result.rows[0];
    
    // Get user agent from latest page view
    const pvResult = await sql`
      SELECT user_agent FROM page_views 
      WHERE visitor_id = ${visitorId} 
      ORDER BY viewed_at DESC 
      LIMIT 1
    `;
    
    const userAgent = pvResult.rows[0]?.user_agent || null;

    // Perform IP lookup
    console.log(`[Manual IP Lookup] Looking up ${visitor.ip_address}...`);
    const lookupData = await lookupIP(visitor.ip_address, userAgent);
    
    // Update visitor
    await updateVisitorLookup(visitor.ip_address, lookupData);

    console.log(`[Manual IP Lookup] Success:`, lookupData);

    return NextResponse.json({
      success: true,
      data: lookupData,
      message: 'IP lookup refreshed successfully'
    });

  } catch (error: any) {
    console.error('Manual IP lookup failed:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
