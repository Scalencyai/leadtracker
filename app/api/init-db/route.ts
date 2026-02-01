import { NextResponse } from 'next/server';
import { initDb } from '@/lib/db';

export const runtime = 'nodejs';

export async function GET() {
  try {
    await initDb();
    return NextResponse.json({ 
      success: true,
      message: 'Database initialized successfully! All tables created.'
    });
  } catch (error: any) {
    console.error('Database initialization failed:', error);
    return NextResponse.json({ 
      success: false,
      error: error.message,
      details: 'Check POSTGRES_URL environment variable and database connection'
    }, { status: 500 });
  }
}

export async function POST() {
  return GET();
}
