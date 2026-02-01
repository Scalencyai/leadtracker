import { NextResponse } from 'next/server';

/**
 * CORS Headers for all tracking endpoints
 * Allows requests from any origin (Framer, custom domains, etc.)
 */
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
  'Access-Control-Max-Age': '86400', // 24 hours
};

/**
 * Add CORS headers to a NextResponse
 */
export function withCors(response: NextResponse): NextResponse {
  Object.entries(corsHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  return response;
}

/**
 * Create a NextResponse with CORS headers
 */
export function corsResponse(data: any, init?: ResponseInit): NextResponse {
  const response = NextResponse.json(data, init);
  return withCors(response);
}

/**
 * Handle OPTIONS preflight requests
 */
export function handleOptions(): NextResponse {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  });
}
