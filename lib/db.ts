import initSqlJs, { Database as SqlJsDatabase } from 'sql.js';
import fs from 'fs';
import path from 'path';

let db: SqlJsDatabase | null = null;
let SQL: any = null;

const DB_PATH = path.join(process.cwd(), 'leadtracker.db');

// Initialize SQL.js
async function initSQL() {
  if (!SQL) {
    SQL = await initSqlJs({
      locateFile: (file: string) => `https://sql.js.org/dist/${file}`
    });
  }
  return SQL;
}

// Lazy database connection
async function getDb(): Promise<SqlJsDatabase> {
  if (!db) {
    await initSQL();
    
    // Load existing database or create new one
    if (fs.existsSync(DB_PATH)) {
      const buffer = fs.readFileSync(DB_PATH);
      db = new SQL.Database(buffer);
    } else {
      db = new SQL.Database();
    }
    
    // Initialize schema
    await initDb();
  }
  return db!;
}

// Save database to disk
function saveDb() {
  if (db) {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_PATH, buffer);
  }
}

// Initialize database schema
export async function initDb() {
  const database = await getDb();
  database.run(`
    CREATE TABLE IF NOT EXISTS visitors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ip_address TEXT NOT NULL UNIQUE,
      company_name TEXT,
      country TEXT,
      city TEXT,
      isp TEXT,
      is_bot INTEGER DEFAULT 0,
      is_isp INTEGER DEFAULT 0,
      first_seen INTEGER NOT NULL,
      last_seen INTEGER NOT NULL,
      lookup_cached_at INTEGER
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
  saveDb();
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
  const database = await getDb();
  const result = database.exec('SELECT * FROM visitors WHERE ip_address = ?', [ipAddress]);
  
  if (result.length > 0 && result[0].values.length > 0) {
    const row = result[0].values[0];
    database.run('UPDATE visitors SET last_seen = ? WHERE ip_address = ?', [timestamp, ipAddress]);
    saveDb();
    
    return {
      id: row[0] as number,
      ip_address: row[1] as string,
      company_name: row[2] as string | null,
      country: row[3] as string | null,
      city: row[4] as string | null,
      isp: row[5] as string | null,
      is_bot: row[6] as number,
      is_isp: row[7] as number,
      first_seen: row[8] as number,
      last_seen: timestamp,
      lookup_cached_at: row[10] as number | null,
    };
  }

  database.run(`
    INSERT INTO visitors (ip_address, first_seen, last_seen)
    VALUES (?, ?, ?)
  `, [ipAddress, timestamp, timestamp]);
  saveDb();
  
  const newResult = database.exec('SELECT last_insert_rowid()');
  const id = newResult[0].values[0][0] as number;

  return {
    id,
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
export async function addPageView(
  visitorId: number,
  pageUrl: string,
  referrer: string | null,
  userAgent: string | null,
  timestamp: number
): Promise<PageView> {
  const database = await getDb();
  database.run(`
    INSERT INTO page_views (visitor_id, page_url, referrer, user_agent, viewed_at)
    VALUES (?, ?, ?, ?, ?)
  `, [visitorId, pageUrl, referrer, userAgent, timestamp]);
  saveDb();

  const result = database.exec('SELECT last_insert_rowid()');
  const id = result[0].values[0][0] as number;

  return {
    id,
    visitor_id: visitorId,
    page_url: pageUrl,
    referrer,
    user_agent: userAgent,
    viewed_at: timestamp,
    duration: 0,
  };
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
  const database = await getDb();
  const timestamp = Date.now();
  database.run(`
    UPDATE visitors
    SET company_name = ?,
        country = ?,
        city = ?,
        isp = ?,
        is_bot = ?,
        is_isp = ?,
        lookup_cached_at = ?
    WHERE ip_address = ?
  `, [
    data.company_name,
    data.country,
    data.city,
    data.isp,
    data.is_bot ? 1 : 0,
    data.is_isp ? 1 : 0,
    timestamp,
    ipAddress
  ]);
  saveDb();
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
  const database = await getDb();
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

  const result = database.exec(query, params);
  if (result.length === 0) return [];

  const columns = result[0].columns;
  const rows = result[0].values;

  return rows.map(row => {
    const visitor: any = {};
    columns.forEach((col, idx) => {
      visitor[col] = row[idx];
    });
    visitor.pages_viewed = visitor.pages_viewed ? visitor.pages_viewed.split(',') : [];
    return visitor as VisitorWithStats;
  });
}

// Get visitor details with all page views
export async function getVisitorDetails(visitorId: number): Promise<{ visitor: Visitor; pageViews: PageView[] } | null> {
  const database = await getDb();
  
  const visitorResult = database.exec('SELECT * FROM visitors WHERE id = ?', [visitorId]);
  if (visitorResult.length === 0 || visitorResult[0].values.length === 0) return null;

  const vRow = visitorResult[0].values[0];
  const visitor: Visitor = {
    id: vRow[0] as number,
    ip_address: vRow[1] as string,
    company_name: vRow[2] as string | null,
    country: vRow[3] as string | null,
    city: vRow[4] as string | null,
    isp: vRow[5] as string | null,
    is_bot: vRow[6] as number,
    is_isp: vRow[7] as number,
    first_seen: vRow[8] as number,
    last_seen: vRow[9] as number,
    lookup_cached_at: vRow[10] as number | null,
  };

  const pvResult = database.exec('SELECT * FROM page_views WHERE visitor_id = ? ORDER BY viewed_at DESC', [visitorId]);
  const pageViews: PageView[] = [];
  
  if (pvResult.length > 0) {
    pvResult[0].values.forEach(row => {
      pageViews.push({
        id: row[0] as number,
        visitor_id: row[1] as number,
        page_url: row[2] as string,
        referrer: row[3] as string | null,
        user_agent: row[4] as string | null,
        viewed_at: row[5] as number,
        duration: row[6] as number,
      });
    });
  }

  return { visitor, pageViews };
}

// Get unique countries
export async function getCountries(): Promise<string[]> {
  const database = await getDb();
  const result = database.exec('SELECT DISTINCT country FROM visitors WHERE country IS NOT NULL ORDER BY country');
  if (result.length === 0) return [];
  return result[0].values.map(row => row[0] as string);
}

// Clean old data
export async function cleanOldData(retentionDays: number): Promise<number> {
  const database = await getDb();
  const cutoffTime = Date.now() - retentionDays * 24 * 60 * 60 * 1000;
  database.run('DELETE FROM visitors WHERE last_seen < ?', [cutoffTime]);
  saveDb();
  
  const result = database.exec('SELECT changes()');
  return result[0].values[0][0] as number;
}

// Check if visitor needs IP lookup
export function needsLookup(visitor: Visitor): boolean {
  if (!visitor.lookup_cached_at) return true;
  const cacheAge = Date.now() - visitor.lookup_cached_at;
  const oneDayMs = 24 * 60 * 60 * 1000;
  return cacheAge > oneDayMs;
}

export { getDb };
export default getDb;
