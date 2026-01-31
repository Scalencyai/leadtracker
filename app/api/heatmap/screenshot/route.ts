import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

// GET: Get screenshot for a page
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page_url = searchParams.get('page_url');

    if (!page_url) {
      return NextResponse.json(
        { error: 'page_url is required' },
        { status: 400 }
      );
    }

    const result = await sql`
      SELECT * FROM page_screenshots WHERE page_url = ${page_url}
    `;

    if (result.rows.length === 0) {
      return NextResponse.json(
        { screenshot: null },
        { status: 200 }
      );
    }

    return NextResponse.json(result.rows[0]);
  } catch (error: any) {
    console.error('Screenshot fetch error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

// POST: Save screenshot for a page
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      page_url,
      screenshot_data,
      viewport_width,
      viewport_height
    } = body;

    if (!page_url || !screenshot_data) {
      return NextResponse.json(
        { error: 'page_url and screenshot_data are required' },
        { status: 400 }
      );
    }

    // Check if exists
    const existing = await sql`
      SELECT id FROM page_screenshots WHERE page_url = ${page_url}
    `;

    if (existing.rows.length > 0) {
      // Update
      await sql`
        UPDATE page_screenshots
        SET 
          screenshot_data = ${screenshot_data},
          viewport_width = ${viewport_width || null},
          viewport_height = ${viewport_height || null},
          updated_at = NOW()
        WHERE page_url = ${page_url}
      `;
    } else {
      // Insert
      await sql`
        INSERT INTO page_screenshots (
          page_url, screenshot_data, viewport_width, viewport_height
        ) VALUES (
          ${page_url}, ${screenshot_data}, 
          ${viewport_width || null}, ${viewport_height || null}
        )
      `;
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Screenshot save error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
