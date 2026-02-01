import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { corsResponse, handleOptions } from '@/lib/cors';

// GET: List all session recordings
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const page_url = searchParams.get('page_url');
    const visitor_id = searchParams.get('visitor_id');
    const min_duration = parseInt(searchParams.get('min_duration') || '0');

    let query = `
      SELECT 
        id, session_id, visitor_id, page_url, 
        duration, page_count, created_at, completed
      FROM session_recordings
      WHERE 1=1
    `;
    
    const params: any[] = [];
    let paramIndex = 1;

    if (page_url) {
      query += ` AND page_url = $${paramIndex}`;
      params.push(page_url);
      paramIndex++;
    }

    if (visitor_id) {
      query += ` AND visitor_id = $${paramIndex}`;
      params.push(visitor_id);
      paramIndex++;
    }

    if (min_duration > 0) {
      query += ` AND duration >= $${paramIndex}`;
      params.push(min_duration);
      paramIndex++;
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramIndex}`;
    params.push(limit);

    const result = await sql.query(query, params);

    return corsResponse({
      sessions: result.rows,
      count: result.rows.length
    });
  } catch (error: any) {
    console.error('Session list error:', error);
    return corsResponse(
      { error: error.message },
      { status: 500 }
    );
  }
}

// POST: Create or update session recording
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { session_id, visitor_id, page_url, events, duration, page_count, completed } = body;

    if (!session_id || !page_url) {
      return corsResponse(
        { error: 'session_id and page_url are required' },
        { status: 400 }
      );
    }

    // Check if session exists
    const existing = await sql`
      SELECT id FROM session_recordings WHERE session_id = ${session_id}
    `;

    if (existing.rows.length > 0) {
      // Update existing
      await sql`
        UPDATE session_recordings
        SET 
          events = ${JSON.stringify(events || [])},
          duration = ${duration || 0},
          page_count = ${page_count || 1},
          completed = ${completed || false},
          updated_at = NOW()
        WHERE session_id = ${session_id}
      `;
    } else {
      // Insert new
      await sql`
        INSERT INTO session_recordings (
          session_id, visitor_id, page_url, events, 
          duration, page_count, completed
        ) VALUES (
          ${session_id}, ${visitor_id || null}, ${page_url}, 
          ${JSON.stringify(events || [])}, ${duration || 0}, 
          ${page_count || 1}, ${completed || false}
        )
      `;
    }

    return corsResponse({ success: true });
  } catch (error: any) {
    console.error('Session save error:', error);
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
