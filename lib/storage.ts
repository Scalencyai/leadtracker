// Simple localStorage-based storage for visitor tracking
// No database needed!

export interface Visitor {
  id: string;
  ip_address: string;
  company_name: string | null;
  country: string | null;
  city: string | null;
  isp: string | null;
  is_bot: boolean;
  is_isp: boolean;
  first_seen: number;
  last_seen: number;
  lookup_cached_at: number | null;
}

export interface PageView {
  id: string;
  visitor_id: string;
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

const STORAGE_KEY_VISITORS = 'leadtracker_visitors';
const STORAGE_KEY_PAGE_VIEWS = 'leadtracker_page_views';

// Get all visitors from localStorage
export function getVisitors(): Visitor[] {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(STORAGE_KEY_VISITORS);
  return data ? JSON.parse(data) : [];
}

// Get all page views from localStorage
export function getPageViews(): PageView[] {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(STORAGE_KEY_PAGE_VIEWS);
  return data ? JSON.parse(data) : [];
}

// Save visitors to localStorage
function saveVisitors(visitors: Visitor[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY_VISITORS, JSON.stringify(visitors));
}

// Save page views to localStorage
function savePageViews(pageViews: PageView[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY_PAGE_VIEWS, JSON.stringify(pageViews));
}

// Get or create visitor by IP
export function getOrCreateVisitor(ipAddress: string, timestamp: number): Visitor {
  const visitors = getVisitors();
  let visitor = visitors.find(v => v.ip_address === ipAddress);

  if (visitor) {
    visitor.last_seen = timestamp;
    saveVisitors(visitors);
    return visitor;
  }

  visitor = {
    id: `v_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    ip_address: ipAddress,
    company_name: null,
    country: null,
    city: null,
    isp: null,
    is_bot: false,
    is_isp: false,
    first_seen: timestamp,
    last_seen: timestamp,
    lookup_cached_at: null,
  };

  visitors.push(visitor);
  saveVisitors(visitors);
  return visitor;
}

// Add page view
export function addPageView(
  visitorId: string,
  pageUrl: string,
  referrer: string | null,
  userAgent: string | null,
  timestamp: number
): PageView {
  const pageViews = getPageViews();
  
  const pageView: PageView = {
    id: `pv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    visitor_id: visitorId,
    page_url: pageUrl,
    referrer,
    user_agent: userAgent,
    viewed_at: timestamp,
    duration: 0,
  };

  pageViews.push(pageView);
  savePageViews(pageViews);
  return pageView;
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
  const visitors = getVisitors();
  const visitor = visitors.find(v => v.ip_address === ipAddress);
  
  if (visitor) {
    visitor.company_name = data.company_name;
    visitor.country = data.country;
    visitor.city = data.city;
    visitor.isp = data.isp;
    visitor.is_bot = data.is_bot;
    visitor.is_isp = data.is_isp;
    visitor.lookup_cached_at = Date.now();
    saveVisitors(visitors);
  }
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
  let visitors = getVisitors();
  const pageViews = getPageViews();

  // Apply filters
  if (filters?.hideBotsAndISPs) {
    visitors = visitors.filter(v => !v.is_bot && !v.is_isp);
  }

  if (filters?.country) {
    visitors = visitors.filter(v => v.country === filters.country);
  }

  if (filters?.search) {
    const query = filters.search.toLowerCase();
    visitors = visitors.filter(v =>
      v.company_name?.toLowerCase().includes(query) ||
      v.ip_address.includes(query)
    );
  }

  if (filters?.dateFrom) {
    visitors = visitors.filter(v => v.last_seen >= filters.dateFrom!);
  }

  if (filters?.dateTo) {
    visitors = visitors.filter(v => v.last_seen <= filters.dateTo!);
  }

  if (filters?.activeOnly) {
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
    visitors = visitors.filter(v => v.last_seen >= fiveMinutesAgo);
  }

  // Add stats
  return visitors.map(v => {
    const visitorPageViews = pageViews.filter(pv => pv.visitor_id === v.id);
    return {
      ...v,
      total_visits: visitorPageViews.length,
      pages_viewed: [...new Set(visitorPageViews.map(pv => pv.page_url))],
    };
  }).sort((a, b) => b.last_seen - a.last_seen);
}

// Get visitor details with all page views
export function getVisitorDetails(visitorId: string): { visitor: Visitor; pageViews: PageView[] } | null {
  const visitors = getVisitors();
  const visitor = visitors.find(v => v.id === visitorId);
  
  if (!visitor) return null;

  const pageViews = getPageViews()
    .filter(pv => pv.visitor_id === visitorId)
    .sort((a, b) => b.viewed_at - a.viewed_at);

  return { visitor, pageViews };
}

// Get unique countries
export function getCountries(): string[] {
  const visitors = getVisitors();
  const countries = new Set(visitors.map(v => v.country).filter(Boolean));
  return Array.from(countries).sort() as string[];
}

// Clean old data
export function cleanOldData(retentionDays: number): number {
  const visitors = getVisitors();
  const pageViews = getPageViews();
  const cutoffTime = Date.now() - retentionDays * 24 * 60 * 60 * 1000;

  const oldVisitors = visitors.filter(v => v.last_seen < cutoffTime);
  const newVisitors = visitors.filter(v => v.last_seen >= cutoffTime);
  
  const oldVisitorIds = new Set(oldVisitors.map(v => v.id));
  const newPageViews = pageViews.filter(pv => !oldVisitorIds.has(pv.visitor_id));

  saveVisitors(newVisitors);
  savePageViews(newPageViews);

  return oldVisitors.length;
}

// Check if visitor needs IP lookup
export function needsLookup(visitor: Visitor): boolean {
  if (!visitor.lookup_cached_at) return true;
  const cacheAge = Date.now() - visitor.lookup_cached_at;
  const oneDayMs = 24 * 60 * 60 * 1000;
  return cacheAge > oneDayMs;
}

// Export data as JSON
export function exportData(): string {
  return JSON.stringify({
    visitors: getVisitors(),
    pageViews: getPageViews(),
    exportedAt: new Date().toISOString(),
  }, null, 2);
}

// Import data from JSON
export function importData(jsonData: string): void {
  try {
    const data = JSON.parse(jsonData);
    if (data.visitors && Array.isArray(data.visitors)) {
      saveVisitors(data.visitors);
    }
    if (data.pageViews && Array.isArray(data.pageViews)) {
      savePageViews(data.pageViews);
    }
  } catch (error) {
    console.error('Failed to import data:', error);
    throw new Error('Invalid import data');
  }
}
