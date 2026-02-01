import { NextRequest, NextResponse } from 'next/server';
import { getOrCreateVisitor, addPageView } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Rate limiting (in-memory for performance)
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

    // Use visitor_id as IP address for now (cookie-based tracking)
    // In the future, we can enhance this with real IP lookup
    const ipAddress = ip !== 'unknown' ? ip : visitor_id;

    // Get or create visitor in DB
    const visitor = await getOrCreateVisitor(ipAddress, timestamp);

    // Add page view to DB
    await addPageView(
      visitor.id,
      url,
      referrer || null,
      userAgent || null,
      timestamp
    );

    return NextResponse.json({ 
      success: true,
      visitor_id: visitor.id 
    }, {
      headers: { 'Access-Control-Allow-Origin': '*' }
    });
  } catch (error: any) {
    console.error('Track API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { 
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
