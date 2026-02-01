/**
 * Domain to Company Mapper
 * Extrahiert Company Name aus Domain/Referrer
 */

// Bekannte SaaS/Platform Domains die wir ignorieren
const IGNORE_DOMAINS = new Set([
  'google.com',
  'facebook.com',
  'linkedin.com',
  'twitter.com',
  'x.com',
  'instagram.com',
  'youtube.com',
  'tiktok.com',
  'reddit.com',
  'pinterest.com',
  'amazon.com',
  'ebay.com',
  'alibaba.com',
  'github.com',
  'stackoverflow.com',
  'medium.com',
  'substack.com',
  'wordpress.com',
  'blogger.com',
  'wix.com',
  'squarespace.com',
  'shopify.com',
  'mailchimp.com',
  'hubspot.com',
  'salesforce.com',
  'zoom.us',
  'slack.com',
  'discord.com',
  'telegram.org',
  'whatsapp.com',
  'dropbox.com',
  'drive.google.com',
  'onedrive.live.com',
  'icloud.com',
  'apple.com',
  'microsoft.com',
]);

/**
 * Extract domain from URL/Referrer
 */
export function extractDomain(url: string | null): string | null {
  if (!url) return null;
  
  try {
    const urlObj = new URL(url);
    let domain = urlObj.hostname;
    
    // Remove www prefix
    domain = domain.replace(/^www\./, '');
    
    return domain;
  } catch {
    return null;
  }
}

/**
 * Extract company name from domain
 */
export function domainToCompany(domain: string | null): string | null {
  if (!domain) return null;
  
  // Check if ignored domain
  if (IGNORE_DOMAINS.has(domain)) {
    return null;
  }
  
  // Remove TLD (.com, .ch, .de, etc.)
  const parts = domain.split('.');
  
  // Skip if too many subdomains (likely CDN/hosting)
  if (parts.length > 3) {
    return null;
  }
  
  // Get main domain part (before TLD)
  const mainPart = parts[parts.length - 2];
  
  if (!mainPart || mainPart.length < 2) {
    return null;
  }
  
  // Capitalize first letter
  const companyName = mainPart
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
  
  return companyName;
}

/**
 * Get company info from referrer
 */
export function getCompanyFromReferrer(referrer: string | null): {
  domain: string | null;
  company: string | null;
} {
  const domain = extractDomain(referrer);
  const company = domainToCompany(domain);
  
  return { domain, company };
}

/**
 * Examples:
 * 
 * https://calenso.com/booking → domain: calenso.com, company: Calenso
 * https://www.scalency.ai/ → domain: scalency.ai, company: Scalency
 * https://app.notion.so/... → domain: notion.so, company: Notion
 * https://mail.google.com → domain: google.com, company: null (ignored)
 * https://cdn.example.com → domain: example.com, company: Example
 */
