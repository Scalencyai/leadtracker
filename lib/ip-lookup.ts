import { whoisLookup } from './whois-lookup';
import { checkIPOverride } from './db';

// Bot detection patterns
const BOT_PATTERNS = [
  /googlebot/i,
  /bingbot/i,
  /slurp/i,
  /duckduckbot/i,
  /baiduspider/i,
  /yandexbot/i,
  /facebookexternalhit/i,
  /twitterbot/i,
  /rogerbot/i,
  /linkedinbot/i,
  /embedly/i,
  /quora link preview/i,
  /showyoubot/i,
  /outbrain/i,
  /pinterest\/0\./i,
  /developers\.google\.com\/\+\/web\/snippet/i,
  /slackbot/i,
  /vkshare/i,
  /w3c_validator/i,
  /redditbot/i,
  /applebot/i,
  /whatsapp/i,
  /flipboard/i,
  /tumblr/i,
  /bitlybot/i,
  /skypeuripreview/i,
  /nuzzel/i,
  /discordbot/i,
  /qwantify/i,
  /pinterestbot/i,
  /bot/i,
  /crawler/i,
  /spider/i,
];

// Common ISP names
const ISP_PATTERNS = [
  /vodafone/i,
  /telekom/i,
  /comcast/i,
  /verizon/i,
  /at&t/i,
  /charter/i,
  /cox/i,
  /centurylink/i,
  /frontier/i,
  /spectrum/i,
  /optimum/i,
  /mediacom/i,
  /windstream/i,
  /wow/i,
  /altice/i,
  /sprint/i,
  /t-mobile/i,
  /orange/i,
  /bt /i,
  /sky /i,
  /virgin media/i,
  /talktalk/i,
  /ee /i,
  /o2/i,
  /three/i,
  /swisscom/i,
  /sunrise/i,
  /salt/i,
  /upc/i,
];

export function isBot(userAgent: string | null): boolean {
  if (!userAgent) return false;
  return BOT_PATTERNS.some(pattern => pattern.test(userAgent));
}

export function isISP(ispName: string | null): boolean {
  if (!ispName) return false;
  return ISP_PATTERNS.some(pattern => pattern.test(ispName));
}

export interface IPLookupResult {
  company_name: string | null;
  country: string | null;
  city: string | null;
  isp: string | null;
  is_bot: boolean;
  is_isp: boolean;
}

// Extract company name from hostname
function extractCompanyFromHostname(hostname: string): string | null {
  if (!hostname || hostname.includes('static') || hostname.includes('dynamic')) {
    return null;
  }
  
  // Remove common suffixes
  const parts = hostname.toLowerCase()
    .replace(/\.(com|ch|de|net|org|io|ai|co|uk|fr|eu)$/i, '')
    .split('.');
  
  // Get the main domain part
  const domain = parts[parts.length - 1];
  
  if (!domain || domain.length < 3) return null;
  
  // Capitalize first letter of each word
  return domain
    .split(/[-_]/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// Perform reverse DNS lookup
async function reverseDNSLookup(ipAddress: string): Promise<string | null> {
  try {
    // Use a DNS-over-HTTPS service for reverse lookup
    const response = await fetch(`https://dns.google/resolve?name=${ipAddress}&type=PTR`);
    const data = await response.json();
    
    if (data.Answer && data.Answer.length > 0) {
      const hostname = data.Answer[0].data;
      return hostname.replace(/\.$/, ''); // Remove trailing dot
    }
  } catch (error) {
    console.error('Reverse DNS failed:', error);
  }
  return null;
}

// Perform IP lookup using ipapi.is (free tier: 1000/day) + Reverse DNS + WHOIS
export async function lookupIP(ipAddress: string, userAgent: string | null): Promise<IPLookupResult> {
  // Check if it's a bot first
  const botDetected = isBot(userAgent);

  try {
    // 1. Check manual IP overrides first (highest priority!)
    const companyFromOverride = await checkIPOverride(ipAddress);
    if (companyFromOverride) {
      console.log(`[IP Lookup] ✓ Manual Override: ${companyFromOverride}`);
      return {
        company_name: companyFromOverride,
        country: null, // Will be filled by ipapi.is below
        city: null,
        isp: null,
        is_bot: botDetected,
        is_isp: false,
      };
    }
    
    // 2. Try reverse DNS for better company detection
    const hostname = await reverseDNSLookup(ipAddress);
    let companyFromHostname = hostname ? extractCompanyFromHostname(hostname) : null;
    
    console.log(`[IP Lookup] IP: ${ipAddress}, Hostname: ${hostname}, Company from DNS: ${companyFromHostname}`);

    // 3. Use ipapi.is (better than ipapi.co - has datacenter/VPN/security detection)
    const apiKey = process.env.IPAPI_IS_KEY || '';
    const apiUrl = apiKey 
      ? `https://api.ipapi.is?q=${ipAddress}&key=${apiKey}`
      : `https://api.ipapi.is?q=${ipAddress}`;
    
    const response = await fetch(apiUrl, {
      headers: {
        'User-Agent': 'LeadTracker/2.0',
      },
    });

    if (!response.ok) {
      console.warn(`[IP Lookup] ipapi.is failed (${response.status}), falling back to ipapi.co...`);
      return await lookupIPFallback(ipAddress, userAgent);
    }

    const data = await response.json();

    // Extract data from ipapi.is format
    const ispName = data.company?.name || data.asn?.org || null;
    const companyType = data.company?.type || data.asn?.type || null;
    
    // Detect if this is datacenter/hosting (better than simple ISP check!)
    const isDatacenter = data.is_datacenter || companyType === 'hosting';
    const isVPN = data.is_vpn || false;
    const isProxy = data.is_proxy || false;
    const isTor = data.is_tor || false;
    
    // ISP detection (now includes datacenter traffic!)
    const ispDetected = isISP(ispName) || isDatacenter || isVPN || isProxy;

    // Try to extract company name from org field
    let companyFromOrg = null;
    if (ispName && !ispDetected) {
      // Remove AS number prefix
      companyFromOrg = ispName.replace(/^AS\d+\s+/i, '').trim();
    }

    // If still no good company name, try WHOIS lookup
    let companyFromWhois = null;
    if (!companyFromHostname && !companyFromOrg) {
      console.log(`[IP Lookup] No company from DNS/ipapi.is, trying WHOIS...`);
      const whoisData = await whoisLookup(ipAddress);
      companyFromWhois = whoisData.company_name;
      console.log(`[IP Lookup] WHOIS Company: ${companyFromWhois}`);
    }

    // Prefer hostname > WHOIS > org name
    const companyName = companyFromHostname || companyFromWhois || companyFromOrg;

    // Security flags for better lead qualification
    const securityFlags = [];
    if (isDatacenter) securityFlags.push('datacenter');
    if (isVPN) securityFlags.push('vpn');
    if (isProxy) securityFlags.push('proxy');
    if (isTor) securityFlags.push('tor');
    if (data.is_abuser) securityFlags.push('abuser');
    
    if (securityFlags.length > 0) {
      console.log(`[IP Lookup] ⚠️  Security flags: ${securityFlags.join(', ')}`);
    }

    console.log(`[IP Lookup] Final Company: ${companyName} (hostname: ${companyFromHostname}, whois: ${companyFromWhois}, org: ${companyFromOrg})`);

    return {
      company_name: companyName,
      country: data.location?.country || null,
      city: data.location?.city || null,
      isp: ispName,
      is_bot: botDetected,
      is_isp: ispDetected,
    };
  } catch (error) {
    console.error('[IP Lookup] ipapi.is error:', error);
    // Fallback to ipapi.co
    return await lookupIPFallback(ipAddress, userAgent);
  }
}

// Fallback to ipapi.co if ipapi.is fails
export async function lookupIPFallback(ipAddress: string, userAgent: string | null): Promise<IPLookupResult> {
  const botDetected = isBot(userAgent);

  try {
    console.log(`[IP Lookup] Using fallback: ipapi.co`);
    
    const response = await fetch(`https://ipapi.co/${ipAddress}/json/`, {
      headers: {
        'User-Agent': 'LeadTracker/2.0',
      },
    });

    if (!response.ok) {
      throw new Error(`IP lookup failed: ${response.status}`);
    }

    const data = await response.json();

    if (data.error) {
      console.error('[IP Lookup] ipapi.co error:', data.reason || data.error);
      return {
        company_name: null,
        country: null,
        city: null,
        isp: null,
        is_bot: botDetected,
        is_isp: false,
      };
    }

    const ispName = data.org || data.isp || null;
    const ispDetected = isISP(ispName);

    let companyName = null;
    if (ispName && !ispDetected) {
      companyName = ispName.replace(/^AS\d+\s+/i, '').trim();
    }

    return {
      company_name: companyName,
      country: data.country_name || null,
      city: data.city || null,
      isp: ispName,
      is_bot: botDetected,
      is_isp: ispDetected,
    };
  } catch (error) {
    console.error('[IP Lookup] Fallback failed:', error);
    return {
      company_name: null,
      country: null,
      city: null,
      isp: null,
      is_bot: botDetected,
      is_isp: false,
    };
  }
}
