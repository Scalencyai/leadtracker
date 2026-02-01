import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Create tracked_websites table
    await sql`
      CREATE TABLE IF NOT EXISTS tracked_websites (
        url TEXT PRIMARY KEY,
        last_checked BIGINT NOT NULL,
        status TEXT DEFAULT 'unknown'
      )
    `;

    return NextResponse.json({ 
      success: true,
      message: 'tracked_websites table created successfully' 
    });
  } catch (error: any) {
    console.error('Failed to create table:', error);
    return NextResponse.json({ 
      error: error.message 
    }, { status: 500 });
  }
}
