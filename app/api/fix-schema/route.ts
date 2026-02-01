import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 Fixing database schema...');

    const fixes = [];

    // Fix funnel_events table
    try {
      await sql`ALTER TABLE funnel_events ADD COLUMN IF NOT EXISTS event_type TEXT`;
      fixes.push({ table: 'funnel_events', column: 'event_type', status: 'added' });
    } catch (e: any) { fixes.push({ table: 'funnel_events', column: 'event_type', status: 'error', error: e.message }); }

    try {
      await sql`ALTER TABLE funnel_events ADD COLUMN IF NOT EXISTS session_id TEXT`;
      fixes.push({ table: 'funnel_events', column: 'session_id', status: 'added' });
    } catch (e: any) { fixes.push({ table: 'funnel_events', column: 'session_id', status: 'error', error: e.message }); }

    try {
      await sql`ALTER TABLE funnel_events ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW()`;
      fixes.push({ table: 'funnel_events', column: 'created_at', status: 'added' });
    } catch (e: any) { fixes.push({ table: 'funnel_events', column: 'created_at', status: 'error', error: e.message }); }

    // Fix funnels table
    try {
      await sql`ALTER TABLE funnels ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE`;
      fixes.push({ table: 'funnels', column: 'is_active', status: 'added' });
    } catch (e: any) { fixes.push({ table: 'funnels', column: 'is_active', status: 'error', error: e.message }); }

    // Create missing tables
    try {
      await sql`
        CREATE TABLE IF NOT EXISTS funnel_conversions (
          id SERIAL PRIMARY KEY,
          funnel_id INTEGER REFERENCES funnels(id) ON DELETE CASCADE,
          visitor_id TEXT NOT NULL,
          session_id TEXT,
          step_reached INTEGER NOT NULL,
          completed BOOLEAN DEFAULT FALSE,
          time_to_convert INTEGER,
          created_at TIMESTAMP DEFAULT NOW(),
          completed_at TIMESTAMP
        )
      `;
      fixes.push({ table: 'funnel_conversions', status: 'created' });
    } catch (e: any) { fixes.push({ table: 'funnel_conversions', status: 'error', error: e.message }); }

    try {
      await sql`
        CREATE TABLE IF NOT EXISTS page_screenshots (
          id SERIAL PRIMARY KEY,
          page_url TEXT NOT NULL UNIQUE,
          screenshot_data TEXT,
          viewport_width INTEGER,
          viewport_height INTEGER,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `;
      fixes.push({ table: 'page_screenshots', status: 'created' });
    } catch (e: any) { fixes.push({ table: 'page_screenshots', status: 'error', error: e.message }); }

    // Create indexes
    try {
      await sql`CREATE INDEX IF NOT EXISTS idx_funnel_events_session_id ON funnel_events(session_id)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_funnel_events_event_type ON funnel_events(event_type)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_funnel_events_created_at ON funnel_events(created_at DESC)`;
      fixes.push({ type: 'indexes', table: 'funnel_events', status: 'created' });
    } catch (e: any) { fixes.push({ type: 'indexes', table: 'funnel_events', status: 'error', error: e.message }); }

    try {
      await sql`CREATE INDEX IF NOT EXISTS idx_funnel_conversions_funnel_id ON funnel_conversions(funnel_id)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_funnel_conversions_visitor_id ON funnel_conversions(visitor_id)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_funnel_conversions_created_at ON funnel_conversions(created_at DESC)`;
      fixes.push({ type: 'indexes', table: 'funnel_conversions', status: 'created' });
    } catch (e: any) { fixes.push({ type: 'indexes', table: 'funnel_conversions', status: 'error', error: e.message }); }

    try {
      await sql`CREATE INDEX IF NOT EXISTS idx_page_screenshots_page_url ON page_screenshots(page_url)`;
      fixes.push({ type: 'indexes', table: 'page_screenshots', status: 'created' });
    } catch (e: any) { fixes.push({ type: 'indexes', table: 'page_screenshots', status: 'error', error: e.message }); }

    return NextResponse.json({
      success: true,
      message: 'Schema fixes applied',
      fixes
    });

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
