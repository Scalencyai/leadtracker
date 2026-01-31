import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

// GET: Get click events for a page
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page_url = searchParams.get('page_url');
    const days = parseInt(searchParams.get('days') || '7');

    if (!page_url) {
      return NextResponse.json(
        { error: 'page_url is required' },
        { status: 400 }
      );
    }

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const result = await sql`
      SELECT 
        x, y, viewport_width, viewport_height,
        element_selector, element_text, created_at
      FROM click_events
      WHERE page_url = ${page_url}
      AND created_at >= ${cutoffDate.toISOString()}
      ORDER BY created_at DESC
    `;

    return NextResponse.json({
      clicks: result.rows,
      count: result.rows.length
    });
  } catch (error: any) {
    console.error('Click events fetch error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

// POST: Track click event
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      visitor_id,
      session_id,
      page_url,
      x,
      y,
      viewport_width,
      viewport_height,
      element_selector,
      element_text
    } = body;

    if (!visitor_id || !page_url || x === undefined || y === undefined) {
      return NextResponse.json(
        { error: 'visitor_id, page_url, x, and y are required' },
        { status: 400 }
      );
    }

    await sql`
      INSERT INTO click_events (
        visitor_id, session_id, page_url, x, y,
        viewport_width, viewport_height, element_selector, element_text
      ) VALUES (
        ${visitor_id}, ${session_id || null}, ${page_url}, ${x}, ${y},
        ${viewport_width || null}, ${viewport_height || null},
        ${element_selector || null}, ${element_text || null}
      )
    `;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Click event track error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
