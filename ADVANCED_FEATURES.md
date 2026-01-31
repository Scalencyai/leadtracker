# LeadTracker Advanced Features

This document describes the 3 new advanced analytics features added to LeadTracker.

## 🎬 Feature 1: Session Recording & Replay

### Overview
Record and replay user sessions to understand exactly how visitors interact with your website. Built with [rrweb](https://github.com/rrweb-io/rrweb), the leading open-source session recording library.

### What's Tracked
- **DOM Mutations**: All changes to the page structure
- **Mouse Movements**: Cursor position and clicks
- **Scroll Events**: Page scrolling behavior
- **Input Events**: Form interactions (configurable)
- **Viewport Changes**: Window resizing

### Features
- ▶️ **Replay Player**: Watch sessions with play/pause/speed controls
- 🔍 **Filters**: Filter by duration, page URL, visitor ID
- 📊 **Metrics**: Track session duration, page count, completion status
- 💾 **Storage**: Events stored as JSON in Postgres for efficient querying

### Usage

#### API Endpoints
```typescript
// List sessions
GET /api/sessions
  ?limit=50
  &page_url=https://example.com
  &visitor_id=lt_123
  &min_duration=5000

// Get specific session with full event data
GET /api/sessions/{id}

// Create/update session (auto-called by tracking script)
POST /api/sessions
{
  session_id: string,
  visitor_id: string,
  page_url: string,
  events: array,
  duration: number,
  page_count: number,
  completed: boolean
}
```

#### Dashboard
Navigate to `/dashboard/sessions` to:
- View all recorded sessions
- Filter by various criteria
- Click "▶ Replay" to watch any session

### Database Schema
```sql
CREATE TABLE session_recordings (
  id SERIAL PRIMARY KEY,
  session_id TEXT NOT NULL UNIQUE,
  visitor_id TEXT,
  page_url TEXT NOT NULL,
  events JSONB NOT NULL DEFAULT '[]',
  duration INTEGER DEFAULT 0,
  page_count INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  completed BOOLEAN DEFAULT FALSE
);
```

---

## 📊 Feature 2: Conversion Funnel Analytics

### Overview
Define multi-step funnels to track user journeys and identify where visitors drop off. Visualize conversion rates, drop-off rates, and time-to-convert metrics.

### Features
- 🔨 **Funnel Builder**: Visual UI to define funnel steps
- 📈 **Analytics Dashboard**: See conversion rates, drop-offs, and timing
- 🎯 **Event Matching**: Flexible rules (exact, contains, regex)
- ⏱️ **Time Tracking**: Measure time between steps and total time-to-convert
- 📊 **Visualization**: Sankey-style funnel diagram with drop-off indicators

### Supported Event Types
- `pageview`: Page visits (e.g., landing page)
- `click`: Button/element clicks
- `form_submit`: Form submissions
- `custom`: Custom events you define

### Usage

#### Creating a Funnel
1. Go to `/dashboard/funnels`
2. Click "Create Funnel"
3. Define funnel name and steps
4. Choose event types and matching rules
5. Save and view analytics

#### Example Funnel
```javascript
{
  name: "Sign-up Funnel",
  steps: [
    {
      name: "Landing Page",
      event_type: "pageview",
      event_name: "/",
      match_rule: "exact"
    },
    {
      name: "CTA Click",
      event_type: "click",
      event_name: "button#signup",
      match_rule: "contains"
    },
    {
      name: "Form Submit",
      event_type: "form_submit",
      event_name: "signup_form",
      match_rule: "exact"
    }
  ]
}
```

#### Tracking Custom Events
```javascript
// Use the global function exposed by the tracking script
window.leadTrackerEvent('custom', 'video_play', { video_id: '123' });
window.leadTrackerEvent('click', 'nav_link', { destination: '/pricing' });
```

#### API Endpoints
```typescript
// List all funnels
GET /api/funnels

// Create funnel
POST /api/funnels
{
  name: string,
  description: string,
  steps: FunnelStep[]
}

// Get funnel analytics
GET /api/funnels/{id}/analytics?days=30

// Track funnel event (auto-called by tracking script)
POST /api/funnel-events
{
  visitor_id: string,
  session_id: string,
  event_type: string,
  event_name: string,
  page_url: string,
  metadata: object
}
```

### Database Schema
```sql
CREATE TABLE funnels (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  steps JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE funnel_events (
  id SERIAL PRIMARY KEY,
  visitor_id TEXT NOT NULL,
  session_id TEXT,
  event_type TEXT NOT NULL,
  event_name TEXT NOT NULL,
  page_url TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE funnel_conversions (
  id SERIAL PRIMARY KEY,
  funnel_id INTEGER REFERENCES funnels(id),
  visitor_id TEXT NOT NULL,
  session_id TEXT,
  step_reached INTEGER NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  time_to_convert INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);
```

---

## 🔥 Feature 3: Click & Scroll Heatmaps

### Overview
Visualize where users click and how far they scroll on your pages. Identify hot spots, ignored areas, and scroll depth patterns.

### Features
- 🖱️ **Click Heatmaps**: See exact click coordinates with intensity visualization
- 📜 **Scroll Heatmaps**: Understand how far users scroll (0-100%)
- 📸 **Screenshot Overlay**: Optional page screenshots for context
- 📊 **Depth Distribution**: Histogram of scroll depth ranges
- 🎨 **Heat Intensity**: Color-coded from blue (low) to red (high frequency)

### What's Tracked

#### Clicks
- X/Y coordinates
- Viewport dimensions
- Element selector
- Element text content
- Timestamp

#### Scrolls
- Current scroll depth (%)
- Maximum scroll depth reached
- Viewport height
- Total page height

### Usage

#### Dashboard
1. Go to `/dashboard/heatmaps`
2. Enter page URL
3. Select time range (1-90 days)
4. Toggle between Click/Scroll views
5. Analyze hot spots and patterns

#### API Endpoints
```typescript
// Get click events
GET /api/heatmap/clicks
  ?page_url=https://example.com/page
  &days=7

// Track click (auto-called by tracking script)
POST /api/heatmap/clicks
{
  visitor_id: string,
  session_id: string,
  page_url: string,
  x: number,
  y: number,
  viewport_width: number,
  viewport_height: number,
  element_selector: string,
  element_text: string
}

// Get scroll events
GET /api/heatmap/scroll
  ?page_url=https://example.com/page
  &days=7

// Track scroll (auto-called by tracking script)
POST /api/heatmap/scroll
{
  visitor_id: string,
  session_id: string,
  page_url: string,
  scroll_depth: number,
  max_scroll_depth: number,
  viewport_height: number,
  page_height: number
}

// Save/get page screenshot
GET /api/heatmap/screenshot?page_url=...
POST /api/heatmap/screenshot
{
  page_url: string,
  screenshot_data: string (base64),
  viewport_width: number,
  viewport_height: number
}
```

### Database Schema
```sql
CREATE TABLE click_events (
  id SERIAL PRIMARY KEY,
  visitor_id TEXT NOT NULL,
  session_id TEXT,
  page_url TEXT NOT NULL,
  x INTEGER NOT NULL,
  y INTEGER NOT NULL,
  viewport_width INTEGER,
  viewport_height INTEGER,
  element_selector TEXT,
  element_text TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE scroll_events (
  id SERIAL PRIMARY KEY,
  visitor_id TEXT NOT NULL,
  session_id TEXT,
  page_url TEXT NOT NULL,
  scroll_depth INTEGER NOT NULL,
  max_scroll_depth INTEGER NOT NULL,
  viewport_height INTEGER,
  page_height INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE page_screenshots (
  id SERIAL PRIMARY KEY,
  page_url TEXT NOT NULL UNIQUE,
  screenshot_data TEXT,
  viewport_width INTEGER,
  viewport_height INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

---

## 🚀 Installation

### 1. Install Dependencies
```bash
npm install rrweb rrweb-player recharts html2canvas d3-sankey @types/d3-sankey
```

### 2. Initialize Database
```bash
node scripts/init-advanced-features.js
```

This will create:
- All necessary tables
- Indexes for performance
- A sample funnel

### 3. Deploy Tracking Script

#### Option A: Advanced Analytics (Recommended)
Includes all 3 features:
```html
<!-- Before </body> tag -->
<script src="https://cdn.jsdelivr.net/npm/rrweb@latest/dist/rrweb.min.js" async></script>
<script src="https://leadtracker-ivory.vercel.app/leadtracker-advanced.js" async></script>
```

#### Option B: Basic Tracking Only
Just visitor tracking (original behavior):
```html
<script src="https://leadtracker-ivory.vercel.app/track.js" async></script>
```

### 4. Verify Installation
1. Visit your website with the script installed
2. Open DevTools Console (F12)
3. Look for: `[LeadTracker] Advanced analytics initialized`
4. Check the dashboard:
   - Sessions: `/dashboard/sessions`
   - Funnels: `/dashboard/funnels`
   - Heatmaps: `/dashboard/heatmaps`

---

## 📊 Analytics Dashboard

### Navigation
The dashboard now includes 4 tabs:
- **👥 Visitors**: Original visitor tracking
- **▶️ Sessions**: Session recordings
- **📊 Funnels**: Conversion funnel analytics
- **🔥 Heatmaps**: Click & scroll heatmaps

### Session Recordings
- **List View**: Filter by duration, page, visitor
- **Replay Player**: Watch sessions with controls (play/pause/speed)
- **Metrics**: Duration, page count, completion status

### Funnel Analytics
- **Funnel Builder**: Create multi-step funnels
- **Visualization**: Sankey-style diagram with drop-offs
- **Metrics**: Conversion rate, drop-off rate, time-to-convert
- **Step Details**: Per-step analytics table

### Heatmaps
- **Page Selector**: Enter any page URL
- **Time Range**: 1-90 days
- **View Modes**: Toggle between click/scroll
- **Stats**: Total clicks, avg scroll depth, etc.

---

## 🔒 Privacy & Performance

### Session Recording
- **Opt-out**: Respects DNT (Do Not Track) header
- **Sampling**: Configurable sampling rates to reduce data
- **Privacy**: Input values not recorded by default (configurable)
- **Size**: Events batched and sent every 10 seconds

### Heatmaps
- **Anonymous**: No PII collected
- **Aggregated**: Individual clicks/scrolls can't be traced back
- **Efficient**: Minimal impact on page load (<1ms per event)

### General
- **Async Loading**: Scripts load asynchronously (no blocking)
- **CDN**: rrweb loaded from CDN for fast delivery
- **Indexes**: Database optimized with indexes for fast queries
- **GDPR**: All data can be deleted by visitor_id

---

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes (Edge Functions)
- **Database**: Vercel Postgres (PostgreSQL)
- **Session Recording**: rrweb + rrweb-player
- **Visualization**: Recharts (funnels), HTML5 Canvas (heatmaps)
- **Screenshots**: html2canvas (optional)

---

## 📈 Performance Considerations

### Database
- **Indexes**: All query-heavy fields indexed
- **JSONB**: Events stored as JSONB for flexible querying
- **Cleanup**: Consider setting up retention policies (e.g., delete events >90 days)

### Frontend
- **Lazy Loading**: Heavy components loaded on-demand
- **Debouncing**: Scroll events debounced to reduce API calls
- **Batching**: Session events sent in batches, not individually

### Scaling
- **Partitioning**: Consider partitioning large tables by date
- **Archiving**: Move old sessions to cold storage
- **CDN**: Serve static assets (rrweb) from CDN

---

## 🐛 Troubleshooting

### Sessions Not Recording
1. Check console for errors
2. Verify rrweb is loaded: `typeof rrweb !== 'undefined'`
3. Check network tab for POST to `/api/sessions`
4. Verify DB table exists: `SELECT * FROM session_recordings`

### Funnel Not Tracking
1. Ensure events are being sent: Check network tab
2. Verify funnel is active: `SELECT * FROM funnels WHERE is_active = true`
3. Check event matching logic in `/api/funnel-events`

### Heatmap Not Showing
1. Verify clicks/scrolls are tracked: Check network tab
2. Ensure page_url matches exactly (including protocol)
3. Check time range (default 7 days)

---

## 📝 TODO / Future Enhancements

- [ ] Session search by visitor actions
- [ ] Heatmap comparison (A/B testing)
- [ ] Export funnels as CSV/PDF
- [ ] Real-time session monitoring
- [ ] Automated funnel insights (AI-powered)
- [ ] Click rage detection
- [ ] Dead click analysis
- [ ] Form abandonment tracking

---

## 🙏 Credits

- **rrweb**: Session recording engine
- **Recharts**: Funnel visualization
- **Next.js**: Framework
- **Vercel**: Hosting & Database

---

## 📄 License

Same as LeadTracker (MIT)
