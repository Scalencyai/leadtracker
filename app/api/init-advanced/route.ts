import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import fs from 'fs';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Initializing Advanced Features...');

    // Read schema file
    const schemaPath = path.join(process.cwd(), 'lib', 'db-schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    // Split into individual statements
    const statements = schema
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    const results = [];

    // Execute each statement
    for (const statement of statements) {
      const tableMatch = statement.match(/CREATE TABLE IF NOT EXISTS (\w+)/i);
      const indexMatch = statement.match(/CREATE INDEX IF NOT EXISTS (\w+)/i);
      
      const name = tableMatch?.[1] || indexMatch?.[1] || 'unknown';
      const type = tableMatch ? 'table' : 'index';

      try {
        await sql.query(statement + ';');
        results.push({ name, type, status: 'success' });
      } catch (error: any) {
        results.push({ name, type, status: 'error', error: error.message });
      }
    }

    // Create sample funnel
    try {
      await sql`
        INSERT INTO funnels (name, description, steps, is_active)
        VALUES (
          'Sample Conversion Funnel',
          'Page View → Button Click → Form Submit',
          ${JSON.stringify([
            { name: 'Landing Page', event_type: 'pageview', event_name: '/', match_rule: 'exact' },
            { name: 'CTA Click', event_type: 'click', event_name: 'button#signup', match_rule: 'contains' },
            { name: 'Form Submission', event_type: 'form_submit', event_name: 'signup_form', match_rule: 'exact' }
          ])},
          true
        )
        ON CONFLICT DO NOTHING
      `;
      results.push({ name: 'sample_funnel', type: 'data', status: 'success' });
    } catch (error: any) {
      results.push({ name: 'sample_funnel', type: 'data', status: 'skipped', error: error.message });
    }

    return NextResponse.json({
      success: true,
      message: 'Advanced features initialized',
      results
    });

  } catch (error: any) {
    console.error('Init error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
