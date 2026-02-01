import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@vercel/postgres';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const client = createClient();
  
  try {
    await client.connect();
    
    const { ip, company, notes, secret } = await request.json();
    
    // Simple auth
    if (secret !== 'leadtracker-admin-2024') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    if (!ip || !company) {
      return NextResponse.json({ error: 'Missing ip or company' }, { status: 400 });
    }
    
    // Convert IP to bigint
    const ipParts = ip.split('.');
    const ipNum = BigInt(ipParts[0]) * 16777216n + 
                  BigInt(ipParts[1]) * 65536n + 
                  BigInt(ipParts[2]) * 256n + 
                  BigInt(ipParts[3]);
    
    console.log(`[Admin] Adding IP override: ${ip} → ${company} (${ipNum})`);
    
    // Add to ip_overrides table
    await client.query(`
      INSERT INTO ip_overrides (ip_start, ip_end, company_name, notes, created_at, updated_at)
      VALUES ($1, $2, $3, $4, NOW(), NOW())
      ON CONFLICT (ip_start, ip_end) 
      DO UPDATE SET 
        company_name = $3,
        notes = $4,
        updated_at = NOW()
    `, [ipNum.toString(), ipNum.toString(), company, notes || 'Manual override']);
    
    console.log(`[Admin] ✅ IP override added`);
    
    // Update existing visitor
    const result = await client.query(`
      UPDATE visitors 
      SET company_name = $1,
          is_isp = 0
      WHERE ip_address = $2
      RETURNING *
    `, [company, ip]);
    
    if (result.rowCount && result.rowCount > 0) {
      console.log(`[Admin] ✅ Updated existing visitor record`);
    } else {
      console.log(`[Admin] ℹ️  No existing visitor (will apply on next visit)`);
    }
    
    return NextResponse.json({ 
      success: true,
      message: `IP ${ip} mapped to ${company}`,
      updated: result.rowCount ? result.rowCount > 0 : false
    });
    
  } catch (error: any) {
    console.error('[Admin] Error:', error);
    return NextResponse.json({ 
      error: 'Failed to add IP override',
      details: error.message 
    }, { status: 500 });
  } finally {
    await client.end();
  }
}
