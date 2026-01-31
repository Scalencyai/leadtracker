import { NextRequest, NextResponse } from 'next/server';
import { getOrCreateVisitor, addPageView, updateVisitorLookup, needsLookup } from '@/lib/db';
import { lookupIP } from '@/lib/ip-lookup';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Rate limiting - simple in-memory store (use Redis for production)
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

// Clean up old rate limit entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of rateLimitMap.entries()) {
    if (now > record.resetAt) {
      rateLimitMap.delete(ip);
    }
  }
}, 60000);

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
    const { url, referrer, userAgent, timestamp } = body;

    if (!url || !timestamp) {
      return NextResponse.json({ error: 'Missing required fields' }, { 
        status: 400,
        headers: { 'Access-Control-Allow-Origin': '*' }
      });
    }

    // Get or create visitor
    const visitor = getOrCreateVisitor(ip, timestamp);

    // Add page view
    addPageView(visitor.id, url, referrer, userAgent, timestamp);

    // Perform IP lookup if needed (async, don't block response)
    if (needsLookup(visitor)) {
      lookupIP(ip, userAgent)
        .then(lookupData => {
          updateVisitorLookup(ip, lookupData);
        })
        .catch(err => {
          console.error('IP lookup failed for', ip, err);
        });
    }

    return NextResponse.json({ success: true }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
      }
    });
  } catch (error) {
    console.error('Track API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { 
      status: 500,
      headers: { 'Access-Control-Allow-Origin': '*' }
    });
  }
}

// Handle OPTIONS for CORS
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
