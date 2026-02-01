#!/usr/bin/env node
/**
 * Quick test script for ipapi.is integration
 */

const testIPs = [
  { ip: '8.8.8.8', expected: 'Google DNS (Datacenter)' },
  { ip: '1.1.1.1', expected: 'Cloudflare DNS (Datacenter)' },
  { ip: '46.101.0.1', expected: 'DigitalOcean (Datacenter)' },
];

async function testIPAPIis(ip) {
  try {
    const response = await fetch(`https://api.ipapi.is?q=${ip}`);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const data = await response.json();
    
    return {
      ip: data.ip,
      company: data.company?.name || 'Unknown',
      city: data.location?.city || 'Unknown',
      country: data.location?.country || 'Unknown',
      type: data.company?.type || data.asn?.type || 'unknown',
      is_datacenter: data.is_datacenter || false,
      is_vpn: data.is_vpn || false,
      is_proxy: data.is_proxy || false,
      is_tor: data.is_tor || false,
      is_abuser: data.is_abuser || false,
    };
  } catch (error) {
    console.error(`❌ Error for ${ip}:`, error.message);
    return null;
  }
}

async function main() {
  console.log('🧪 Testing ipapi.is Integration\n');
  console.log('=' . repeat(80));
  
  for (const test of testIPs) {
    console.log(`\n📍 Testing: ${test.ip} (${test.expected})`);
    console.log('-'.repeat(80));
    
    const result = await testIPAPIis(test.ip);
    
    if (!result) {
      console.log('❌ Test failed\n');
      continue;
    }
    
    console.log(`Company:    ${result.company}`);
    console.log(`Location:   ${result.city}, ${result.country}`);
    console.log(`Type:       ${result.type}`);
    console.log(`Datacenter: ${result.is_datacenter ? '✅ YES' : '❌ NO'}`);
    console.log(`VPN:        ${result.is_vpn ? '✅ YES' : '❌ NO'}`);
    console.log(`Proxy:      ${result.is_proxy ? '✅ YES' : '❌ NO'}`);
    console.log(`Tor:        ${result.is_tor ? '✅ YES' : '❌ NO'}`);
    console.log(`Abuser:     ${result.is_abuser ? '⚠️  YES' : '✅ NO'}`);
    
    // Delay to respect rate limits
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('✅ Test complete!\n');
}

main().catch(console.error);
