import Database from 'better-sqlite3';
import path from 'path';

let db: Database.Database | null = null;

// Lazy database connection
function getDb(): Database.Database {
  if (!db) {
    const dbPath = path.join(process.cwd(), 'leadtracker.db');
    db = new Database(dbPath);
    
    // Enable WAL mode for better concurrent access
    db.pragma('journal_mode = WAL');
    
    // Initialize schema
    initDb();
  }
  return db;
}

// Initialize database schema
export function initDb() {
  const database = getDb();
  database.exec(`
    CREATE TABLE IF NOT EXISTS visitors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ip_address TEXT NOT NULL,
      company_name TEXT,
      country TEXT,
      city TEXT,
      isp TEXT,
      is_bot INTEGER DEFAULT 0,
      is_isp INTEGER DEFAULT 0,
      first_seen INTEGER NOT NULL,
      last_seen INTEGER NOT NULL,
      lookup_cached_at INTEGER,
      UNIQUE(ip_address)
    );

    CREATE TABLE IF NOT EXISTS page_views (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      visitor_id INTEGER NOT NULL,
      page_url TEXT NOT NULL,
      referrer TEXT,
      user_agent TEXT,
      viewed_at INTEGER NOT NULL,
      duration INTEGER DEFAULT 0,
      FOREIGN KEY (visitor_id) REFERENCES visitors(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_visitors_last_seen ON visitors(last_seen DESC);
    CREATE INDEX IF NOT EXISTS idx_visitors_ip ON visitors(ip_address);
    CREATE INDEX IF NOT EXISTS idx_page_views_visitor ON page_views(visitor_id);
    CREATE INDEX IF NOT EXISTS idx_page_views_time ON page_views(viewed_at DESC);
  `);
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
export function getOrCreateVisitor(ipAddress: string, timestamp: number): Visitor {
  const database = getDb();
  const existing = database.prepare('SELECT * FROM visitors WHERE ip_address = ?').get(ipAddress) as Visitor | undefined;
  
  if (existing) {
    database.prepare('UPDATE visitors SET last_seen = ? WHERE ip_address = ?').run(timestamp, ipAddress);
    return { ...existing, last_seen: timestamp };
  }

  const result = database.prepare(`
    INSERT INTO visitors (ip_address, first_seen, last_seen)
    VALUES (?, ?, ?)
  `).run(ipAddress, timestamp, timestamp);

  return {
    id: Number(result.lastInsertRowid),
    ip_address: ipAddress,
    company_name: null,
    country: null,
    city: null,
    isp: null,
    is_bot: 0,
    is_isp: 0,
    first_seen: timestamp,
    last_seen: timestamp,
    lookup_cached_at: null,
  };
}

// Add page view
export function addPageView(visitorId: number, pageUrl: string, referrer: string | null, userAgent: string | null, timestamp: number): PageView {
  const database = getDb();
  const result = database.prepare(`
    INSERT INTO page_views (visitor_id, page_url, referrer, user_agent, viewed_at)
    VALUES (?, ?, ?, ?, ?)
  `).run(visitorId, pageUrl, referrer, userAgent, timestamp);

  return {
    id: Number(result.lastInsertRowid),
    visitor_id: visitorId,
    page_url: pageUrl,
    referrer,
    user_agent: userAgent,
    viewed_at: timestamp,
    duration: 0,
  };
}

// Update visitor with IP lookup data
export function updateVisitorLookup(
  ipAddress: string,
  data: {
    company_name: string | null;
    country: string | null;
    city: string | null;
    isp: string | null;
    is_bot: boolean;
    is_isp: boolean;
  }
): void {
  const database = getDb();
  const timestamp = Date.now();
  database.prepare(`
    UPDATE visitors
    SET company_name = ?,
        country = ?,
        city = ?,
        isp = ?,
        is_bot = ?,
        is_isp = ?,
        lookup_cached_at = ?
    WHERE ip_address = ?
  `).run(
    data.company_name,
    data.country,
    data.city,
    data.isp,
    data.is_bot ? 1 : 0,
    data.is_isp ? 1 : 0,
    timestamp,
    ipAddress
  );
}

// Get all visitors with stats
export function getVisitorsWithStats(filters?: {
  hideBotsAndISPs?: boolean;
  country?: string;
  search?: string;
  dateFrom?: number;
  dateTo?: number;
  activeOnly?: boolean;
}): VisitorWithStats[] {
  const database = getDb();
  let query = `
    SELECT 
      v.*,
      COUNT(pv.id) as total_visits,
      GROUP_CONCAT(DISTINCT pv.page_url) as pages_viewed
    FROM visitors v
    LEFT JOIN page_views pv ON v.id = pv.visitor_id
    WHERE 1=1
  `;

  const params: any[] = [];

  if (filters?.hideBotsAndISPs) {
    query += ' AND v.is_bot = 0 AND v.is_isp = 0';
  }

  if (filters?.country) {
    query += ' AND v.country = ?';
    params.push(filters.country);
  }

  if (filters?.search) {
    query += ' AND (v.company_name LIKE ? OR v.ip_address LIKE ?)';
    const searchPattern = `%${filters.search}%`;
    params.push(searchPattern, searchPattern);
  }

  if (filters?.dateFrom) {
    query += ' AND v.last_seen >= ?';
    params.push(filters.dateFrom);
  }

  if (filters?.dateTo) {
    query += ' AND v.last_seen <= ?';
    params.push(filters.dateTo);
  }

  if (filters?.activeOnly) {
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
    query += ' AND v.last_seen >= ?';
    params.push(fiveMinutesAgo);
  }

  query += ' GROUP BY v.id ORDER BY v.last_seen DESC';

  const visitors = database.prepare(query).all(...params) as any[];

  return visitors.map(v => ({
    ...v,
    pages_viewed: v.pages_viewed ? v.pages_viewed.split(',') : [],
  }));
}

// Get visitor details with all page views
export function getVisitorDetails(visitorId: number): { visitor: Visitor; pageViews: PageView[] } | null {
  const database = getDb();
  const visitor = database.prepare('SELECT * FROM visitors WHERE id = ?').get(visitorId) as Visitor | undefined;
  if (!visitor) return null;

  const pageViews = database.prepare('SELECT * FROM page_views WHERE visitor_id = ? ORDER BY viewed_at DESC').all(visitorId) as PageView[];

  return { visitor, pageViews };
}

// Get unique countries
export function getCountries(): string[] {
  const database = getDb();
  const rows = database.prepare('SELECT DISTINCT country FROM visitors WHERE country IS NOT NULL ORDER BY country').all() as { country: string }[];
  return rows.map(r => r.country);
}

// Clean old data
export function cleanOldData(retentionDays: number): number {
  const database = getDb();
  const cutoffTime = Date.now() - retentionDays * 24 * 60 * 60 * 1000;
  const result = database.prepare('DELETE FROM visitors WHERE last_seen < ?').run(cutoffTime);
  return result.changes;
}

// Check if visitor needs IP lookup (not cached or cache expired)
export function needsLookup(visitor: Visitor): boolean {
  if (!visitor.lookup_cached_at) return true;
  const cacheAge = Date.now() - visitor.lookup_cached_at;
  const oneDayMs = 24 * 60 * 60 * 1000;
  return cacheAge > oneDayMs;
}

export { getDb };
export default getDb;
