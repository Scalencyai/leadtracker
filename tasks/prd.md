# LeadTracker - Free B2B Website Visitor Identification

## Introduction

LeadTracker is a free, open-source alternative to Leadinfo and Leadfeeder. It helps B2B companies identify which companies visit their website through reverse IP lookup, enabling sales teams to reach out to warm leads proactively.

**The Problem:** 98% of website visitors leave without converting. B2B companies don't know which companies are researching their products, missing valuable sales opportunities.

**The Solution:** LeadTracker reveals company names, contact details, and visitor behavior in real-time through a simple tracking script and intuitive dashboard.

## Goals

- Enable any business to identify their website visitors for free
- Provide real-time visibility into company visits and page views
- Deliver a simple, self-hosted alternative to expensive tools (Leadfeeder: €99-1199/month)
- Make B2B lead generation accessible to startups and small businesses

## User Stories

### US-001: Install Tracking Script
**Description:** As a website owner, I want to easily generate and install a tracking script so that I can start identifying visitors immediately.

**Acceptance Criteria:**
- [ ] User can generate unique tracking script from dashboard
- [ ] Script is a simple <script> tag (copy-paste)
- [ ] Script loads asynchronously (no page speed impact)
- [ ] Script sends visitor data to API endpoint
- [ ] Installation guide is clear and includes test verification
- [ ] Typecheck/lint passes
- [ ] **[UI]** Verify script generator in browser using dev-browser skill

### US-002: View Visitor Dashboard (Realtime)
**Description:** As a sales person, I want to see which companies are visiting my website right now so that I can reach out while they're researching.

**Acceptance Criteria:**
- [ ] Dashboard shows list of identified companies in realtime
- [ ] Each entry shows: Company name, Location (Country/City), Time of visit, Pages viewed
- [ ] Realtime updates using Server-Sent Events (no manual refresh)
- [ ] "Now visiting" badge for active sessions (<5 min ago)
- [ ] Unidentified visitors show as "Unknown Company" with IP
- [ ] Typecheck/lint passes
- [ ] **[UI]** Verify realtime updates in browser

### US-003: Reverse IP Lookup
**Description:** As the system, I want to automatically identify company names from IP addresses so that users see meaningful visitor data.

**Acceptance Criteria:**
- [ ] API endpoint receives visitor IP address
- [ ] System performs reverse IP lookup using free API (ipapi.co or ip-api.com)
- [ ] Response includes: Company name, Country, City, ISP
- [ ] Bot/ISP traffic is flagged and can be filtered out
- [ ] Lookups are cached (24h) to reduce API calls
- [ ] Failed lookups show "Unknown Company" gracefully
- [ ] Typecheck/lint passes

### US-004: View Visitor Details
**Description:** As a sales person, I want to see detailed visit information for each company so that I can understand their interests and buying intent.

**Acceptance Criteria:**
- [ ] Click on company row to see detailed view
- [ ] Details show: All pages visited (chronological), Time spent on each page, Referrer source (Google, LinkedIn, Direct), Total session duration, First seen / Last seen timestamps
- [ ] Page URLs are human-readable (not raw paths)
- [ ] Typecheck/lint passes
- [ ] **[UI]** Verify detail panel in browser

### US-005: Filter and Search Visitors
**Description:** As a user, I want to filter the visitor list by company name, country, and date range so that I can focus on relevant leads.

**Acceptance Criteria:**
- [ ] Search box filters by company name (client-side, instant)
- [ ] Filter by country (dropdown with all detected countries)
- [ ] Filter by date range (Today, Last 7 days, Last 30 days, Custom)
- [ ] Filter by "Active Now" (last 5 minutes)
- [ ] Filter by "Identified Only" (hide Unknown companies)
- [ ] Filters are combinable (AND logic)
- [ ] Typecheck/lint passes
- [ ] **[UI]** Verify all filters work correctly

### US-006: Export Visitor Data
**Description:** As a user, I want to export visitor data to CSV so that I can import it into my CRM or analyze it further.

**Acceptance Criteria:**
- [ ] "Export to CSV" button on dashboard
- [ ] CSV includes: Company Name, Country, City, First Seen, Last Seen, Total Visits, Pages Viewed (comma-separated)
- [ ] Export respects current filters
- [ ] File downloads with timestamp (e.g., leadtracker_2026-01-31.csv)
- [ ] Typecheck/lint passes

### US-007: Bot Detection and Filtering
**Description:** As the system, I want to filter out bot traffic and ISPs so that users only see real company visits.

**Acceptance Criteria:**
- [ ] Common bots are detected (Googlebot, Bingbot, etc.) via User-Agent
- [ ] ISP traffic is flagged (e.g., "Vodafone", "Deutsche Telekom")
- [ ] Flagged traffic has "isBot" or "isISP" boolean
- [ ] Dashboard has toggle to "Show/Hide Bots & ISPs"
- [ ] Default: Bots/ISPs are hidden
- [ ] Typecheck/lint passes

## Functional Requirements

### Frontend (Dashboard)
- **FR-1:** Next.js app with Server Components for initial load
- **FR-2:** Realtime updates via Server-Sent Events (EventSource API)
- **FR-3:** Responsive design (mobile-friendly)
- **FR-4:** Dark mode support (system preference)
- **FR-5:** Simple authentication (password-protected dashboard)

### Backend (API)
- **FR-6:** Next.js API routes for tracking endpoint and SSE stream
- **FR-7:** SQLite database for storing visitor data (lightweight, self-hosted)
- **FR-8:** Reverse IP lookup integration with free tier API (ipapi.co: 1000 requests/day)
- **FR-9:** Data retention: 30 days (auto-delete older records)
- **FR-10:** Rate limiting on tracking endpoint (prevent abuse)

### Tracking Script
- **FR-11:** Vanilla JavaScript (no dependencies)
- **FR-12:** Collects: Page URL, Referrer, User-Agent, Timestamp
- **FR-13:** Sends data via Beacon API (works even on page unload)
- **FR-14:** Respects Do Not Track (DNT) header
- **FR-15:** < 2KB minified

### Data Schema
- **FR-16:** Visitors table: `id, company_name, ip_address, country, city, is_bot, is_isp, first_seen, last_seen`
- **FR-17:** PageViews table: `id, visitor_id, page_url, referrer, user_agent, viewed_at, duration`

## Technical Stack

- **Frontend:** Next.js 14 (App Router), React Server Components, TailwindCSS
- **Backend:** Next.js API Routes, SQLite (better-sqlite3)
- **Realtime:** Server-Sent Events (SSE)
- **IP Lookup:** ipapi.co (free tier: 1000/day) or ip-api.com (backup)
- **Hosting:** Vercel (free tier) or self-hosted
- **Auth:** Simple password protection (env variable)

## Non-Goals (Out of Scope for V1)

- ❌ CRM integrations (HubSpot, Salesforce, etc.)
- ❌ Email/LinkedIn outreach features
- ❌ Contact database / decision-maker lookup
- ❌ Advanced lead scoring algorithms
- ❌ Multi-user accounts / team features
- ❌ Mobile app
- ❌ Webhook notifications
- ❌ Custom IP database (rely on free APIs)

## Success Metrics

- **Installation:** User can install tracking script in < 2 minutes
- **Identification Rate:** 40%+ of visitors identified as companies (realistic for free IP lookup)
- **Realtime Performance:** Dashboard updates within 2 seconds of page view
- **Page Speed:** Tracking script adds < 100ms to page load
- **Self-Hosting:** Works on Vercel free tier (no paid dependencies)

## Design Guidelines

**Aesthetic:** Clean, professional dashboard inspired by Leadfeeder's simplicity but with modern touches.

**Key UI Elements:**
- **Dashboard:** Card-based layout showing "Visitors Today", "Active Now", "Companies This Week"
- **Visitor List:** Table with subtle hover states, company logos (optional), country flags
- **Detail Panel:** Slide-out panel (not modal) for visitor details
- **Realtime Indicator:** Pulsing green dot for "Now Visiting" entries
- **Empty States:** Friendly messages with setup instructions

**Colors:**
- Primary: Blue (#3B82F6) for actions/links
- Success: Green (#10B981) for active visitors
- Neutral: Gray scale for text/backgrounds
- Accent: Purple (#8B5CF6) for premium features (future)

**Typography:**
- Headings: Inter (bold, clean)
- Body: Inter (regular)
- Monospace: JetBrains Mono for IPs/URLs

## Implementation Notes

### Reverse IP Lookup Strategy
```javascript
// Free APIs (fallback chain):
1. ipapi.co (1000/day, fast, reliable)
2. ip-api.com (45 requests/min, unlimited)
3. If both fail: Store IP, retry later

// Caching:
- Cache all successful lookups for 24h
- Refresh company data weekly (cron)
```

### Realtime Updates
```javascript
// Server-Sent Events (SSE):
GET /api/visitors/stream
→ Sends new visitor data every 2 seconds
→ Client reconnects on disconnect

// Client:
const eventSource = new EventSource('/api/visitors/stream');
eventSource.onmessage = (e) => {
  const visitor = JSON.parse(e.data);
  updateDashboard(visitor);
};
```

### Bot Detection
```javascript
const botPatterns = [
  /googlebot/i,
  /bingbot/i,
  /slurp/i,
  /duckduckbot/i,
  /baiduspider/i,
  /yandexbot/i,
  /facebookexternalhit/i
];

const isBot = (userAgent) => 
  botPatterns.some(pattern => pattern.test(userAgent));
```

## Open Source Considerations

- MIT License
- Clear README with setup instructions
- Environment variables for config (IP API key, password)
- Docker support (optional, for self-hosting)
- One-click Vercel deploy button
- Contribution guidelines

## Future Enhancements (V2+)

- Email notifications for high-value visitors
- Slack/Discord webhooks
- Lead scoring (page views, time on site)
- CRM integrations (Pipedrive, HubSpot)
- Custom branding (white-label)
- Analytics dashboard (trends, top pages)
- API for programmatic access
