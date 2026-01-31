import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export const runtime = 'nodejs';

export async function GET() {
  try {
    // Check if tables exist
    const tablesResult = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `;

    const tables = tablesResult.rows.map(r => r.table_name);

    // Check environment
    const env = {
      hasPostgresUrl: !!process.env.POSTGRES_URL,
      nodeEnv: process.env.NODE_ENV,
      hasDashboardPassword: !!process.env.DASHBOARD_PASSWORD,
    };

    return NextResponse.json({
      status: 'ok',
      database: {
        connected: true,
        tables: tables,
        tableCount: tables.length,
      },
      environment: env,
    });
  } catch (error: any) {
    return NextResponse.json({
      status: 'error',
      error: error.message,
      stack: error.stack,
    }, { status: 500 });
  }
}
