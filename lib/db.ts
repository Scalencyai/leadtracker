import { Pool } from 'pg';

// Create connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Initialize database schema
export async function initDb() {
  const client = await pool.connect();
  try {
    await client.query(`
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

      CREATE INDEX IF NOT EXISTS idx_visitors_last_seen ON visitors(last_seen DESC);
      CREATE INDEX IF NOT EXISTS idx_visitors_ip ON visitors(ip_address);
      CREATE INDEX IF NOT EXISTS idx_page_views_visitor ON page_views(visitor_id);
      CREATE INDEX IF NOT EXISTS idx_page_views_time ON page_views(viewed_at DESC);
    `);
  } finally {
    client.release();
  }
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
  const client = await pool.connect();
  try {
    // Try to get existing visitor
    let result = await client.query(
      'SELECT * FROM visitors WHERE ip_address = $1',
      [ipAddress]
    );

    if (result.rows.length > 0) {
      // Update last_seen
      await client.query(
        'UPDATE visitors SET last_seen = $1 WHERE ip_address = $2',
        [timestamp, ipAddress]
      );
      return { ...result.rows[0], last_seen: timestamp };
    }

    // Insert new visitor
    result = await client.query(
      `INSERT INTO visitors (ip_address, first_seen, last_seen)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [ipAddress, timestamp, timestamp]
    );

    return result.rows[0];
  } finally {
    client.release();
  }
}

// Add page view
export async function addPageView(
  visitorId: number,
  pageUrl: string,
  referrer: string | null,
  userAgent: string | null,
  timestamp: number
): Promise<PageView> {
  const client = await pool.connect();
  try {
    const result = await client.query(
      `INSERT INTO page_views (visitor_id, page_url, referrer, user_agent, viewed_at)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [visitorId, pageUrl, referrer, userAgent, timestamp]
    );

    return result.rows[0];
  } finally {
    client.release();
  }
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
  const client = await pool.connect();
  try {
    const timestamp = Date.now();
    await client.query(
      `UPDATE visitors
       SET company_name = $1,
           country = $2,
           city = $3,
           isp = $4,
           is_bot = $5,
           is_isp = $6,
           lookup_cached_at = $7
       WHERE ip_address = $8`,
      [
        data.company_name,
        data.country,
        data.city,
        data.isp,
        data.is_bot ? 1 : 0,
        data.is_isp ? 1 : 0,
        timestamp,
        ipAddress
      ]
    );
  } finally {
    client.release();
  }
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
  const client = await pool.connect();
  try {
    let query = `
      SELECT 
        v.*,
        COUNT(pv.id) as total_visits,
        STRING_AGG(DISTINCT pv.page_url, ',') as pages_viewed
      FROM visitors v
      LEFT JOIN page_views pv ON v.id = pv.visitor_id
      WHERE 1=1
    `;

    const params: any[] = [];
    let paramIndex = 1;

    if (filters?.hideBotsAndISPs) {
      query += ' AND v.is_bot = 0 AND v.is_isp = 0';
    }

    if (filters?.country) {
      query += ` AND v.country = $${paramIndex++}`;
      params.push(filters.country);
    }

    if (filters?.search) {
      query += ` AND (v.company_name ILIKE $${paramIndex} OR v.ip_address ILIKE $${paramIndex + 1})`;
      const searchPattern = `%${filters.search}%`;
      params.push(searchPattern, searchPattern);
      paramIndex += 2;
    }

    if (filters?.dateFrom) {
      query += ` AND v.last_seen >= $${paramIndex++}`;
      params.push(filters.dateFrom);
    }

    if (filters?.dateTo) {
      query += ` AND v.last_seen <= $${paramIndex++}`;
      params.push(filters.dateTo);
    }

    if (filters?.activeOnly) {
      const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
      query += ` AND v.last_seen >= $${paramIndex++}`;
      params.push(fiveMinutesAgo);
    }

    query += ' GROUP BY v.id ORDER BY v.last_seen DESC';

    const result = await client.query(query, params);

    return result.rows.map(v => ({
      ...v,
      pages_viewed: v.pages_viewed ? v.pages_viewed.split(',') : [],
    }));
  } finally {
    client.release();
  }
}

// Get visitor details with all page views
export async function getVisitorDetails(visitorId: number): Promise<{ visitor: Visitor; pageViews: PageView[] } | null> {
  const client = await pool.connect();
  try {
    const visitorResult = await client.query(
      'SELECT * FROM visitors WHERE id = $1',
      [visitorId]
    );

    if (visitorResult.rows.length === 0) return null;

    const pageViewsResult = await client.query(
      'SELECT * FROM page_views WHERE visitor_id = $1 ORDER BY viewed_at DESC',
      [visitorId]
    );

    return {
      visitor: visitorResult.rows[0],
      pageViews: pageViewsResult.rows,
    };
  } finally {
    client.release();
  }
}

// Get unique countries
export async function getCountries(): Promise<string[]> {
  const client = await pool.connect();
  try {
    const result = await client.query(
      'SELECT DISTINCT country FROM visitors WHERE country IS NOT NULL ORDER BY country'
    );
    return result.rows.map(r => r.country);
  } finally {
    client.release();
  }
}

// Clean old data
export async function cleanOldData(retentionDays: number): Promise<number> {
  const client = await pool.connect();
  try {
    const cutoffTime = Date.now() - retentionDays * 24 * 60 * 60 * 1000;
    const result = await client.query(
      'DELETE FROM visitors WHERE last_seen < $1',
      [cutoffTime]
    );
    return result.rowCount || 0;
  } finally {
    client.release();
  }
}

// Check if visitor needs IP lookup
export function needsLookup(visitor: Visitor): boolean {
  if (!visitor.lookup_cached_at) return true;
  const cacheAge = Date.now() - visitor.lookup_cached_at;
  const oneDayMs = 24 * 60 * 60 * 1000;
  return cacheAge > oneDayMs;
}

// Export pool for health checks
export { pool };
export default pool;
