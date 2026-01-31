import { NextRequest, NextResponse } from 'next/server';
import { getVisitorDetails } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const visitorId = parseInt(params.id);
    
    if (isNaN(visitorId)) {
      return NextResponse.json({ error: 'Invalid visitor ID' }, { status: 400 });
    }

    const details = await getVisitorDetails(visitorId);

    if (!details) {
      return NextResponse.json({ error: 'Visitor not found' }, { status: 404 });
    }

    return NextResponse.json(details);
  } catch (error) {
    console.error('Visitor details API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
