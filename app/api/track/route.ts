import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Simple in-memory storage (resets on deploy, but works for demo)
// In production, use Vercel KV or Database
// Use global to share across API routes in same process
const globalData = (global as any).leadtracker || ((global as any).leadtracker = {
  visitors: new Map(),
  pageViews: []
});

const visitorsStore = globalData.visitors;
const pageViewsStore = globalData.pageViews;

// Rate limiting
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string, maxRequests = 100, windowMs = 60000): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record || now > record.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (record.count >= maxRequests) {
    return false;
  }

  record.count++;
  return true;
}

export async function POST(request: NextRequest) {
  try {
    // Get client IP
    const forwardedFor = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');
    const ip = forwardedFor?.split(',')[0].trim() || realIp || 'unknown';

    // Rate limiting
    if (!checkRateLimit(ip)) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { 
        status: 429,
        headers: { 'Access-Control-Allow-Origin': '*' }
      });
    }

    // Parse request body
    const body = await request.json();
    const { visitor_id, url, referrer, userAgent, timestamp } = body;

    if (!visitor_id || !url || !timestamp) {
      return NextResponse.json({ error: 'Missing required fields' }, { 
        status: 400,
        headers: { 'Access-Control-Allow-Origin': '*' }
      });
    }

    // Get or create visitor
    let visitor = visitorsStore.get(visitor_id);
    if (!visitor) {
      visitor = {
        id: visitor_id,
        ip_address: visitor_id,
        company_name: null,
        country: null,
        city: null,
        isp: null,
        is_bot: false,
        is_isp: false,
        first_seen: timestamp,
        last_seen: timestamp,
        lookup_cached_at: null
      };
      visitorsStore.set(visitor_id, visitor);
    } else {
      visitor.last_seen = timestamp;
    }

    // Add page view
    const pageView = {
      id: `pv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      visitor_id: visitor_id,
      page_url: url,
      referrer,
      user_agent: userAgent,
      viewed_at: timestamp,
      duration: 0
    };
    pageViewsStore.push(pageView);

    // Cleanup old data (keep last 1000 page views)
    if (pageViewsStore.length > 1000) {
      pageViewsStore.splice(0, pageViewsStore.length - 1000);
    }

    return NextResponse.json({ success: true }, {
      headers: { 'Access-Control-Allow-Origin': '*' }
    });
  } catch (error) {
    console.error('Track API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { 
      status: 500,
      headers: { 'Access-Control-Allow-Origin': '*' }
    });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
