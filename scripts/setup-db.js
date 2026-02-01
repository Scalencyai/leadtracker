#!/usr/bin/env node
/**
 * Database Setup Script for LeadTracker
 * Initializes all tables in Neon Postgres
 * 
 * Usage: node scripts/setup-db.js
 */

const { sql } = require('@vercel/postgres');

async function setupDatabase() {
  console.log('🚀 Starting database setup...\n');

  try {
    // Check connection
    console.log('📡 Testing database connection...');
    const connectionTest = await sql`SELECT NOW() as current_time`;
    console.log('✅ Connected to database!');
    console.log(`   Server time: ${connectionTest.rows[0].current_time}\n`);

    // Import initDb function
    console.log('📊 Creating tables...');
    
    // Main visitors and page views tables
    await sql`
      CREATE TABLE IF NOT EXISTS visitors (
        id SERIAL PRIMARY KEY,
        ip_address TEXT NOT NULL UNIQUE,
        company_name TEXT,
        country TEXT,
        city TEXT,
        isp TEXT,
        is_bot INTEGER DEFAULT 0,
        is_isp INTEGER DEFAULT 0,
        first_seen BIGINT NOT NULL,
        last_seen BIGINT NOT NULL,
        lookup_cached_at BIGINT
      );
    `;
    console.log('✓ visitors table');

    await sql`
      CREATE TABLE IF NOT EXISTS page_views (
        id SERIAL PRIMARY KEY,
        visitor_id INTEGER NOT NULL,
        page_url TEXT NOT NULL,
        referrer TEXT,
        user_agent TEXT,
        viewed_at BIGINT NOT NULL,
        duration INTEGER DEFAULT 0,
        FOREIGN KEY (visitor_id) REFERENCES visitors(id) ON DELETE CASCADE
      );
    `;
    console.log('✓ page_views table');

    // Session recordings
    await sql`
      CREATE TABLE IF NOT EXISTS session_recordings (
        id SERIAL PRIMARY KEY,
        session_id TEXT NOT NULL UNIQUE,
        visitor_id INTEGER,
        page_url TEXT NOT NULL,
        events JSONB DEFAULT '[]'::jsonb,
        duration INTEGER DEFAULT 0,
        page_count INTEGER DEFAULT 1,
        completed BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        FOREIGN KEY (visitor_id) REFERENCES visitors(id) ON DELETE CASCADE
      );
    `;
    console.log('✓ session_recordings table');

    // Click events for heatmaps
    await sql`
      CREATE TABLE IF NOT EXISTS click_events (
        id SERIAL PRIMARY KEY,
        visitor_id INTEGER NOT NULL,
        session_id TEXT,
        page_url TEXT NOT NULL,
        x INTEGER NOT NULL,
        y INTEGER NOT NULL,
        viewport_width INTEGER,
        viewport_height INTEGER,
        element_selector TEXT,
        element_text TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        FOREIGN KEY (visitor_id) REFERENCES visitors(id) ON DELETE CASCADE
      );
    `;
    console.log('✓ click_events table');

    // Scroll events for heatmaps
    await sql`
      CREATE TABLE IF NOT EXISTS scroll_events (
        id SERIAL PRIMARY KEY,
        visitor_id INTEGER NOT NULL,
        session_id TEXT,
        page_url TEXT NOT NULL,
        scroll_depth INTEGER NOT NULL,
        max_scroll_depth INTEGER NOT NULL,
        viewport_height INTEGER,
        page_height INTEGER,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        FOREIGN KEY (visitor_id) REFERENCES visitors(id) ON DELETE CASCADE
      );
    `;
    console.log('✓ scroll_events table');

    // Conversion funnels
    await sql`
      CREATE TABLE IF NOT EXISTS funnels (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        steps JSONB NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;
    console.log('✓ funnels table');

    // Funnel events
    await sql`
      CREATE TABLE IF NOT EXISTS funnel_events (
        id SERIAL PRIMARY KEY,
        funnel_id INTEGER NOT NULL,
        visitor_id INTEGER NOT NULL,
        step_index INTEGER NOT NULL,
        step_name TEXT NOT NULL,
        page_url TEXT NOT NULL,
        completed_at TIMESTAMPTZ DEFAULT NOW(),
        FOREIGN KEY (funnel_id) REFERENCES funnels(id) ON DELETE CASCADE,
        FOREIGN KEY (visitor_id) REFERENCES visitors(id) ON DELETE CASCADE
      );
    `;
    console.log('✓ funnel_events table\n');

    // Create indexes
    console.log('📑 Creating indexes...');
    
    await sql`CREATE INDEX IF NOT EXISTS idx_visitors_last_seen ON visitors(last_seen DESC)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_visitors_ip ON visitors(ip_address)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_page_views_visitor ON page_views(visitor_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_page_views_time ON page_views(viewed_at DESC)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_sessions_visitor ON session_recordings(visitor_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_sessions_created ON session_recordings(created_at DESC)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_sessions_page_url ON session_recordings(page_url)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_clicks_page ON click_events(page_url)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_clicks_created ON click_events(created_at DESC)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_clicks_visitor ON click_events(visitor_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_scrolls_page ON scroll_events(page_url)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_scrolls_created ON scroll_events(created_at DESC)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_scrolls_visitor ON scroll_events(visitor_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_funnels_created ON funnels(created_at DESC)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_funnel_events_funnel ON funnel_events(funnel_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_funnel_events_visitor ON funnel_events(visitor_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_funnel_events_completed ON funnel_events(completed_at DESC)`;
    
    console.log('✓ All indexes created\n');

    // Verify tables
    console.log('🔍 Verifying tables...');
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `;
    
    console.log('\n📋 Tables in database:');
    tables.rows.forEach(row => {
      console.log(`   • ${row.table_name}`);
    });

    console.log('\n✅ Database setup complete!');
    console.log('\n🎯 Next steps:');
    console.log('   1. Set POSTGRES_URL in Vercel environment variables');
    console.log('   2. Deploy to Vercel: vercel --prod');
    console.log('   3. Test tracking at: https://your-domain.vercel.app\n');

  } catch (error) {
    console.error('\n❌ Database setup failed:', error);
    console.error('\nPlease check:');
    console.error('   • POSTGRES_URL is set in environment variables');
    console.error('   • Neon Postgres database is accessible');
    console.error('   • Database credentials are correct\n');
    process.exit(1);
  }
}

// Run setup
setupDatabase()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
