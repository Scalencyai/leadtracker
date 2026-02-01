// WHOIS Lookup for better company detection
// Free but rate-limited - cache results!

interface WHOISResult {
  company_name: string | null;
  org_name: string | null;
  description: string | null;
  country: string | null;
}

// Extract company from WHOIS org field
function extractCompanyFromOrg(org: string): string | null {
  if (!org) return null;
  
  // Remove common suffixes
  let cleaned = org
    .replace(/\s+(GmbH|AG|Ltd|Limited|Inc|LLC|Corp|Corporation|SA|SRL|BV)\s*$/i, '')
    .replace(/\s+Network\s*$/i, '')
    .replace(/\s+Hosting\s*$/i, '')
    .replace(/^AS\d+\s+/i, '') // Remove AS numbers
    .trim();
  
  // Skip if it looks like an ISP/Hosting
  const skipPatterns = [
    /telekom/i, /vodafone/i, /swisscom/i, /sunrise/i,
    /hosting/i, /server/i, /cloud/i, /datacenter/i, /datacamp/i,
    /amazon/i, /google/i, /microsoft/i, /cloudflare/i,
    /hetzner/i, /ovh/i, /digitalocean/i
  ];
  
  if (skipPatterns.some(pattern => pattern.test(cleaned))) {
    return null;
  }
  
  return cleaned || null;
}

// WHOIS lookup using whois-json API
export async function whoisLookup(ipAddress: string): Promise<WHOISResult> {
  try {
    // Use ipwhois.io - free API (10k requests/month)
    const response = await fetch(`http://ipwhois.app/json/${ipAddress}`);
    
    if (!response.ok) {
      throw new Error(`WHOIS lookup failed: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Check for rate limit
    if (data.error || data.message) {
      console.error('[WHOIS] Error:', data.error || data.message);
      return {
        company_name: null,
        org_name: null,
        description: null,
        country: null
      };
    }
    
    const orgName = data.org || data.isp || data.asn?.org || null;
    const companyName = extractCompanyFromOrg(orgName);
    
    console.log(`[WHOIS] IP: ${ipAddress}, Org: ${orgName}, Company: ${companyName}`);
    
    return {
      company_name: companyName,
      org_name: orgName,
      description: data.asn?.descr || null,
      country: data.country || null
    };
    
  } catch (error) {
    console.error('[WHOIS] Lookup failed:', error);
    return {
      company_name: null,
      org_name: null,
      description: null,
      country: null
    };
  }
}

// Alternative: Use RIPE/ARIN API for more detailed data
export async function ripeWhoisLookup(ipAddress: string): Promise<WHOISResult> {
  try {
    // RIPE NCC API - free, no rate limit!
    const response = await fetch(`https://stat.ripe.net/data/whois/data.json?resource=${ipAddress}`);
    
    if (!response.ok) {
      throw new Error(`RIPE lookup failed: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.data || !data.data.records) {
      return {
        company_name: null,
        org_name: null,
        description: null,
        country: null
      };
    }
    
    // Parse WHOIS records
    const records = data.data.records[0];
    let orgName = null;
    let description = null;
    let country = null;
    
    if (records && records.length > 0) {
      for (const record of records) {
        if (record.key === 'org-name' || record.key === 'descr') {
          orgName = orgName || record.value;
          description = description || record.value;
        }
        if (record.key === 'country') {
          country = record.value;
        }
      }
    }
    
    const companyName = extractCompanyFromOrg(orgName || description);
    
    console.log(`[RIPE WHOIS] IP: ${ipAddress}, Org: ${orgName}, Company: ${companyName}`);
    
    return {
      company_name: companyName,
      org_name: orgName,
      description,
      country
    };
    
  } catch (error) {
    console.error('[RIPE WHOIS] Lookup failed:', error);
    return {
      company_name: null,
      org_name: null,
      description: null,
      country: null
    };
  }
}
