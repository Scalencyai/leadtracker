import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { corsResponse, handleOptions } from '@/lib/cors';

// GET: Get scroll events for a page
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page_url = searchParams.get('page_url');
    const days = parseInt(searchParams.get('days') || '7');

    if (!page_url) {
      return corsResponse(
        { error: 'page_url is required' },
        { status: 400 }
      );
    }

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const result = await sql`
      SELECT 
        scroll_depth, max_scroll_depth,
        viewport_height, page_height, created_at
      FROM scroll_events
      WHERE page_url = ${page_url}
      AND created_at >= ${cutoffDate.toISOString()}
      ORDER BY created_at DESC
    `;

    // Calculate depth distribution
    const depthBuckets = Array(10).fill(0); // 0-10%, 10-20%, ... 90-100%
    
    result.rows.forEach(row => {
      const bucketIndex = Math.min(Math.floor(row.max_scroll_depth / 10), 9);
      depthBuckets[bucketIndex]++;
    });

    return corsResponse({
      scrolls: result.rows,
      count: result.rows.length,
      depth_distribution: depthBuckets.map((count, index) => ({
        range: `${index * 10}-${(index + 1) * 10}%`,
        count
      }))
    });
  } catch (error: any) {
    console.error('Scroll events fetch error:', error);
    return corsResponse(
      { error: error.message },
      { status: 500 }
    );
  }
}

// POST: Track scroll event
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      visitor_id,
      session_id,
      page_url,
      scroll_depth,
      max_scroll_depth,
      viewport_height,
      page_height
    } = body;

    if (!visitor_id || !page_url || scroll_depth === undefined) {
      return corsResponse(
        { error: 'visitor_id, page_url, and scroll_depth are required' },
        { status: 400 }
      );
    }

    await sql`
      INSERT INTO scroll_events (
        visitor_id, session_id, page_url, scroll_depth, max_scroll_depth,
        viewport_height, page_height
      ) VALUES (
        ${visitor_id}, ${session_id || null}, ${page_url}, 
        ${scroll_depth}, ${max_scroll_depth || scroll_depth},
        ${viewport_height || null}, ${page_height || null}
      )
    `;

    return corsResponse({ success: true });
  } catch (error: any) {
    console.error('Scroll event track error:', error);
    return corsResponse(
      { error: error.message },
      { status: 500 }
    );
  }
}

// OPTIONS: Handle preflight requests
export async function OPTIONS() {
  return handleOptions();
}
