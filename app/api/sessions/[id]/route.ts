import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { corsResponse, handleOptions } from '@/lib/cors';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sessionId = params.id;

    const result = await sql`
      SELECT 
        id, session_id, visitor_id, page_url, 
        events, duration, page_count, created_at, completed
      FROM session_recordings
      WHERE id = ${sessionId}
    `;

    if (result.rows.length === 0) {
      return corsResponse(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    return corsResponse(result.rows[0]);
  } catch (error: any) {
    console.error('Session fetch error:', error);
    return corsResponse(
      { error: error.message },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return handleOptions();
}
