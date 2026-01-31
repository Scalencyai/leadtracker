import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Import stores from track route
// Note: This won't work across serverless functions, but good for demo
// In production, use Vercel KV or Database

// Simple global storage (shared within same process)
const globalData = (global as any).leadtracker || ((global as any).leadtracker = {
  visitors: new Map(),
  pageViews: []
});

export async function GET() {
  try {
    const visitors = Array.from(globalData.visitors.values());
    const pageViews = globalData.pageViews;

    // Calculate stats for each visitor
    const visitorsWithStats = visitors.map((v: any) => {
      const visitorPageViews = pageViews.filter((pv: any) => pv.visitor_id === v.id);
      return {
        ...v,
        total_visits: visitorPageViews.length,
        pages_viewed: [...new Set(visitorPageViews.map((pv: any) => pv.page_url))]
      };
    }).sort((a: any, b: any) => b.last_seen - a.last_seen);

    // Get unique countries
    const countries = [...new Set(visitors.map((v: any) => v.country).filter(Boolean))].sort();

    return NextResponse.json({ 
      visitors: visitorsWithStats,
      countries
    });
  } catch (error) {
    console.error('Visitors API error:', error);
    return NextResponse.json({ 
      visitors: [],
      countries: []
    });
  }
}
