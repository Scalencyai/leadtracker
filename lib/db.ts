import { sql } from '@vercel/postgres';

// All functions use the sql client directly from @vercel/postgres
// No need for custom pool setup

// Initialize database schema
export async function initDb() {
  // Visitors table
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
    )`;

  // Page views table
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
    )`;

  // Session recordings table
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
    )`;

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
    )`;

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
    )`;

  // Conversion funnels
  await sql`
    CREATE TABLE IF NOT EXISTS funnels (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      steps JSONB NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )`;

  // Funnel events (visitor progress through funnels)
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
    )`;

  // Create indexes
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
}

export interface Visitor {
  id: number;
  ip_address: string;
  company_name: string | null;
  country: string | null;
  city: string | null;
  isp: string | null;
  is_bot: number;
  is_isp: number;
  first_seen: number;
  last_seen: number;
  lookup_cached_at: number | null;
}

export interface PageView {
  id: number;
  visitor_id: number;
  page_url: string;
  referrer: string | null;
  user_agent: string | null;
  viewed_at: number;
  duration: number;
}

export interface VisitorWithStats extends Visitor {
  total_visits: number;
  pages_viewed: string[];
}

// Get or create visitor by IP
export async function getOrCreateVisitor(ipAddress: string, timestamp: number): Promise<Visitor> {
  // Try to get existing visitor
  const existing = await sql`
    SELECT * FROM visitors WHERE ip_address = ${ipAddress}
  `;

  if (existing.rows.length > 0) {
    // Update last_seen
    await sql`
      UPDATE visitors SET last_seen = ${timestamp} WHERE ip_address = ${ipAddress}
    `;
    return { ...existing.rows[0], last_seen: timestamp } as Visitor;
  }

  // Insert new visitor
  const result = await sql`
    INSERT INTO visitors (ip_address, first_seen, last_seen)
    VALUES (${ipAddress}, ${timestamp}, ${timestamp})
    RETURNING *
  `;

  return result.rows[0] as Visitor;
}

// Add page view
export async function addPageView(
  visitorId: number,
  pageUrl: string,
  referrer: string | null,
  userAgent: string | null,
  timestamp: number
): Promise<PageView> {
  const result = await sql`
    INSERT INTO page_views (visitor_id, page_url, referrer, user_agent, viewed_at)
    VALUES (${visitorId}, ${pageUrl}, ${referrer}, ${userAgent}, ${timestamp})
    RETURNING *
  `;

  return result.rows[0] as PageView;
}

// Update visitor with IP lookup data
export async function updateVisitorLookup(
  ipAddress: string,
  data: {
    company_name: string | null;
    country: string | null;
    city: string | null;
    isp: string | null;
    is_bot: boolean;
    is_isp: boolean;
  }
): Promise<void> {
  const timestamp = Date.now();
  await sql`
    UPDATE visitors
    SET company_name = ${data.company_name},
        country = ${data.country},
        city = ${data.city},
        isp = ${data.isp},
        is_bot = ${data.is_bot ? 1 : 0},
        is_isp = ${data.is_isp ? 1 : 0},
        lookup_cached_at = ${timestamp}
    WHERE ip_address = ${ipAddress}
  `;
}

// Get all visitors with stats
export async function getVisitorsWithStats(filters?: {
  hideBotsAndISPs?: boolean;
  country?: string;
  search?: string;
  dateFrom?: number;
  dateTo?: number;
  activeOnly?: boolean;
}): Promise<VisitorWithStats[]> {
  // Build WHERE conditions
  const conditions: string[] = ['1=1'];
  
  if (filters?.hideBotsAndISPs) {
    conditions.push('v.is_bot = 0 AND v.is_isp = 0');
  }

  if (filters?.country) {
    conditions.push(`v.country = '${filters.country.replace(/'/g, "''")}'`);
  }

  if (filters?.search) {
    const searchPattern = filters.search.replace(/'/g, "''");
    conditions.push(`(v.company_name ILIKE '%${searchPattern}%' OR v.ip_address ILIKE '%${searchPattern}%')`);
  }

  if (filters?.dateFrom) {
    conditions.push(`v.last_seen >= ${filters.dateFrom}`);
  }

  if (filters?.dateTo) {
    conditions.push(`v.last_seen <= ${filters.dateTo}`);
  }

  if (filters?.activeOnly) {
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
    conditions.push(`v.last_seen >= ${fiveMinutesAgo}`);
  }

  const whereClause = conditions.join(' AND ');
  
  const queryText = `
    SELECT 
      v.*,
      COUNT(pv.id) as total_visits,
      STRING_AGG(DISTINCT pv.page_url, ',') as pages_viewed
    FROM visitors v
    LEFT JOIN page_views pv ON v.id = pv.visitor_id
    WHERE ${whereClause}
    GROUP BY v.id 
    ORDER BY v.last_seen DESC
  `;

  const result = await sql.query(queryText);

  return result.rows.map(v => ({
    ...v,
    pages_viewed: v.pages_viewed ? v.pages_viewed.split(',') : [],
  })) as VisitorWithStats[];
}

// Get visitor details with all page views
export async function getVisitorDetails(visitorId: number): Promise<{ visitor: Visitor; pageViews: PageView[] } | null> {
  const visitorResult = await sql`
    SELECT * FROM visitors WHERE id = ${visitorId}
  `;

  if (visitorResult.rows.length === 0) return null;

  const pageViewsResult = await sql`
    SELECT * FROM page_views WHERE visitor_id = ${visitorId} ORDER BY viewed_at DESC
  `;

  return {
    visitor: visitorResult.rows[0] as Visitor,
    pageViews: pageViewsResult.rows as PageView[],
  };
}

// Get unique countries
export async function getCountries(): Promise<string[]> {
  const result = await sql`
    SELECT DISTINCT country FROM visitors WHERE country IS NOT NULL ORDER BY country
  `;
  return result.rows.map(r => r.country);
}

// Clean old data
export async function cleanOldData(retentionDays: number): Promise<number> {
  const cutoffTime = Date.now() - retentionDays * 24 * 60 * 60 * 1000;
  const result = await sql`
    DELETE FROM visitors WHERE last_seen < ${cutoffTime}
  `;
  return result.rowCount || 0;
}

// Check if visitor needs IP lookup
export function needsLookup(visitor: Visitor): boolean {
  if (!visitor.lookup_cached_at) return true;
  const cacheAge = Date.now() - visitor.lookup_cached_at;
  const oneDayMs = 24 * 60 * 60 * 1000;
  return cacheAge > oneDayMs;
}

// Export sql for health checks
export { sql as pool };
export default sql;
