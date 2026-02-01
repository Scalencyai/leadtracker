import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Get all tracked websites
export async function GET() {
  try {
    const result = await sql`
      SELECT url, last_checked, status 
      FROM tracked_websites 
      ORDER BY last_checked DESC
    `;
    
    return NextResponse.json({ 
      websites: result.rows 
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0'
      }
    });
  } catch (error: any) {
    console.error('Failed to fetch tracked websites:', error);
    return NextResponse.json({ 
      websites: [] 
    }, { status: 500 });
  }
}

// Add or update a tracked website
export async function POST(request: NextRequest) {
  try {
    const { url, status } = await request.json();
    
    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // Upsert website
    await sql`
      INSERT INTO tracked_websites (url, last_checked, status)
      VALUES (${url}, ${Date.now()}, ${status || 'unknown'})
      ON CONFLICT (url) 
      DO UPDATE SET 
        last_checked = ${Date.now()},
        status = ${status || 'unknown'}
    `;
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Failed to save tracked website:', error);
    return NextResponse.json({ 
      error: error.message 
    }, { status: 500 });
  }
}
