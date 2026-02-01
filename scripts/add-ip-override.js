#!/usr/bin/env node
/**
 * Add manual IP override to database
 */

const { createClient } = require('@vercel/postgres');

async function addIPOverride(ipAddress, companyName, notes = '') {
  const client = createClient();
  await client.connect();
  
  try {
    // Convert IP to bigint for storage
    const ipParts = ipAddress.split('.');
    const ipNum = BigInt(ipParts[0]) * 16777216n + 
                  BigInt(ipParts[1]) * 65536n + 
                  BigInt(ipParts[2]) * 256n + 
                  BigInt(ipParts[3]);
    
    console.log(`Adding IP override: ${ipAddress} → ${companyName}`);
    console.log(`IP as number: ${ipNum}`);
    
    const result = await client.query(`
      INSERT INTO ip_overrides (ip_start, ip_end, company_name, notes, created_at, updated_at)
      VALUES ($1, $2, $3, $4, NOW(), NOW())
      ON CONFLICT (ip_start, ip_end) 
      DO UPDATE SET 
        company_name = $3,
        notes = $4,
        updated_at = NOW()
      RETURNING *
    `, [ipNum.toString(), ipNum.toString(), companyName, notes]);
    
    console.log('✅ IP override added successfully!');
    console.log(result.rows[0]);
    
    // Update existing visitor record
    const updateResult = await client.query(`
      UPDATE visitors 
      SET company_name = $1,
          is_isp = 0
      WHERE ip_address = $2
      RETURNING *
    `, [companyName, ipAddress]);
    
    if (updateResult.rowCount > 0) {
      console.log('✅ Existing visitor record updated!');
      console.log(updateResult.rows[0]);
    } else {
      console.log('ℹ️  No existing visitor record found (will be used on next visit)');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await client.end();
  }
}

// Run
const ipAddress = process.argv[2] || '178.174.80.54';
const companyName = process.argv[3] || 'Calenso AG';
const notes = process.argv[4] || 'Mike Office IP - Manual Override';

addIPOverride(ipAddress, companyName, notes)
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
