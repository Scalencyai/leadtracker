import { NextRequest, NextResponse } from 'next/server';
import { getOrCreateVisitor, addPageView, needsLookup, updateVisitorLookup } from '@/lib/db';
import { lookupIP } from '@/lib/ip-lookup';

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
    const cfConnectingIp = request.headers.get('cf-connecting-ip'); // Cloudflare
    const xClientIp = request.headers.get('x-client-ip'); // Other proxies
    
    // Try multiple headers in order of preference
    const clientIp = 
      cfConnectingIp ||
      (forwardedFor?.split(',')[0].trim()) || 
      realIp || 
      xClientIp ||
      '127.0.0.1';

    // Rate limiting (use visitor_id for rate limiting, not IP)
    const body = await request.json();
    const { visitor_id, url, referrer, userAgent, timestamp } = body;

    if (!visitor_id || !url || !timestamp) {
      return NextResponse.json({ error: 'Missing required fields' }, { 
        status: 400,
        headers: { 'Access-Control-Allow-Origin': '*' }
      });
    }

    if (!checkRateLimit(visitor_id)) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { 
        status: 429,
        headers: { 'Access-Control-Allow-Origin': '*' }
      });
    }

    // Use real IP address (not visitor_id!)
    const ipAddress = clientIp;

    // Get or create visitor in DB
    const visitor = await getOrCreateVisitor(ipAddress, timestamp);
    
    console.log(`[Track] IP: ${ipAddress}, Visitor ID: ${visitor.id}, User Agent: ${userAgent?.substring(0, 50)}`);

    // Add page view to DB
    await addPageView(
      visitor.id,
      url,
      referrer || null,
      userAgent || null,
      timestamp
    );

    // Perform IP lookup if needed (new visitor or cache expired)
    // Skip for localhost/private IPs
    const isPrivateIP = 
      ipAddress.startsWith('127.') || 
      ipAddress.startsWith('10.') ||
      ipAddress.startsWith('192.168.') ||
      ipAddress.startsWith('172.') ||
      ipAddress === 'localhost' ||
      ipAddress === '::1';

    if (!isPrivateIP && needsLookup(visitor)) {
      console.log(`[IP Lookup] Starting lookup for ${ipAddress}...`);
      // Do async lookup in background (don't block response)
      lookupIP(ipAddress, userAgent || null)
        .then(lookupData => {
          console.log(`[IP Lookup] Success for ${ipAddress}:`, lookupData);
          return updateVisitorLookup(ipAddress, lookupData);
        })
        .catch(err => {
          console.error('[IP Lookup] Failed:', err);
        });
    } else if (isPrivateIP) {
      console.log(`[IP Lookup] Skipping private IP: ${ipAddress}`);
    }

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
