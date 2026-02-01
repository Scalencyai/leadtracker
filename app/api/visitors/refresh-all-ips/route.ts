import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { lookupIP } from '@/lib/ip-lookup';
import { updateVisitorLookup } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST() {
  try {
    // Get all visitors with Unknown location (no country or city)
    const result = await sql`
      SELECT v.id, v.ip_address, pv.user_agent
      FROM visitors v
      LEFT JOIN page_views pv ON v.id = pv.visitor_id
      WHERE (v.country IS NULL OR v.city IS NULL)
        AND v.ip_address NOT LIKE 'Visitor-%'
        AND v.ip_address NOT LIKE '127.%'
        AND v.ip_address NOT LIKE '192.168.%'
        AND v.ip_address NOT LIKE '10.%'
      GROUP BY v.id, v.ip_address, pv.user_agent
      LIMIT 50
    `;

    console.log(`[Bulk IP Lookup] Found ${result.rows.length} visitors to lookup`);

    const results = [];
    
    for (const visitor of result.rows) {
      try {
        console.log(`[Bulk IP Lookup] Looking up ${visitor.ip_address}...`);
        
        const lookupData = await lookupIP(visitor.ip_address, visitor.user_agent);
        
        await updateVisitorLookup(visitor.ip_address, lookupData);
        
        results.push({
          id: visitor.id,
          ip: visitor.ip_address,
          success: true,
          data: lookupData
        });
        
        console.log(`[Bulk IP Lookup] ✓ ${visitor.ip_address}:`, lookupData);
        
        // Rate limit: Wait 100ms between requests
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error: any) {
        console.error(`[Bulk IP Lookup] ✗ ${visitor.ip_address}:`, error.message);
        results.push({
          id: visitor.id,
          ip: visitor.ip_address,
          success: false,
          error: error.message
        });
      }
    }

    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    return NextResponse.json({
      success: true,
      total: result.rows.length,
      successful,
      failed,
      results
    });

  } catch (error: any) {
    console.error('[Bulk IP Lookup] Fatal error:', error);
    return NextResponse.json(
      { 
        error: error.message,
        success: false 
      },
      { status: 500 }
    );
  }
}
