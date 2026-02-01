import { NextResponse } from 'next/server';
import { getVisitorDetails } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const visitorId = parseInt(params.id);
    
    if (isNaN(visitorId)) {
      return NextResponse.json(
        { error: 'Invalid visitor ID' },
        { status: 400 }
      );
    }

    const details = await getVisitorDetails(visitorId);
    
    if (!details) {
      return NextResponse.json(
        { error: 'Visitor not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      visitor: details.visitor,
      pageViews: details.pageViews
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  } catch (error: any) {
    console.error('Visitor details API error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
