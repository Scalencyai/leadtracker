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

// Perform IP lookup using ipapi.co (free tier: 1000/day)
export async function lookupIP(ipAddress: string, userAgent: string | null): Promise<IPLookupResult> {
  // Check if it's a bot first
  const botDetected = isBot(userAgent);

  try {
    // Use ipapi.co free tier
    const response = await fetch(`https://ipapi.co/${ipAddress}/json/`, {
      headers: {
        'User-Agent': 'LeadTracker/1.0',
      },
    });

    if (!response.ok) {
      throw new Error(`IP lookup failed: ${response.status}`);
    }

    const data = await response.json();

    // Handle error responses from ipapi
    if (data.error) {
      console.error('IP lookup error:', data.reason || data.error);
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

    // Try to extract company name from org field
    // Often formatted like "AS12345 Company Name"
    let companyName = null;
    if (ispName && !ispDetected) {
      // Remove AS number prefix
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
    console.error('IP lookup failed:', error);
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

// Fallback to ip-api.com if ipapi.co fails
export async function lookupIPFallback(ipAddress: string, userAgent: string | null): Promise<IPLookupResult> {
  const botDetected = isBot(userAgent);

  try {
    const response = await fetch(`http://ip-api.com/json/${ipAddress}?fields=status,country,city,isp,org`);

    if (!response.ok) {
      throw new Error(`IP lookup failed: ${response.status}`);
    }

    const data = await response.json();

    if (data.status !== 'success') {
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
      country: data.country || null,
      city: data.city || null,
      isp: ispName,
      is_bot: botDetected,
      is_isp: ispDetected,
    };
  } catch (error) {
    console.error('IP lookup fallback failed:', error);
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
