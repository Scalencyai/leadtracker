import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

// GET: List all funnels
export async function GET(req: NextRequest) {
  try {
    const result = await sql`
      SELECT * FROM funnels ORDER BY created_at DESC
    `;

    return NextResponse.json({
      funnels: result.rows
    });
  } catch (error: any) {
    console.error('Funnel list error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

// POST: Create new funnel
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, description, steps } = body;

    if (!name || !steps || !Array.isArray(steps)) {
      return NextResponse.json(
        { error: 'name and steps (array) are required' },
        { status: 400 }
      );
    }

    const result = await sql`
      INSERT INTO funnels (name, description, steps)
      VALUES (${name}, ${description || null}, ${JSON.stringify(steps)})
      RETURNING *
    `;

    return NextResponse.json(result.rows[0]);
  } catch (error: any) {
    console.error('Funnel create error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
