# 🐘 Neon Postgres Integration - LeadTracker

## ✅ Was wurde umgestellt?

**Von:** In-Memory Storage (verliert Daten bei Deploy)  
**Nach:** Neon Postgres (persistente Datenbank)

### 📊 Alle Daten werden jetzt in der DB gespeichert:
- ✅ **Visitors** - IP-basierte Besucher-Tracking
- ✅ **Page Views** - Jede Seite die ein Besucher sieht
- ✅ **Session Recordings** - Komplette User-Sessions mit rrweb
- ✅ **Click Events** - Heatmap Click-Daten
- ✅ **Scroll Events** - Heatmap Scroll-Daten
- ✅ **Funnels** - Conversion Funnel Definitionen
- ✅ **Funnel Events** - User Progress durch Funnels

## 🚀 Setup in Vercel

### 1. Neon Postgres verbinden

In Vercel Dashboard:
1. Gehe zu **Project Settings** → **Storage**
2. Click **Connect Store** → **Neon Postgres**
3. Wähle deine Neon Datenbank
4. Vercel erstellt automatisch `POSTGRES_URL` Environment Variable

### 2. Database initialisieren

**Option A - Automatisch via API Route:**
```bash
# Nach dem Deploy:
curl https://leadtracker-ivory.vercel.app/api/init-db
```

**Option B - Manuell via Script:**
```bash
# Lokal mit POSTGRES_URL env var:
export POSTGRES_URL="postgresql://..."
node scripts/setup-db.js
```

### 3. Environment Variables checken

Vercel sollte automatisch setzen:
```env
POSTGRES_URL=postgresql://...@...neon.tech/...
POSTGRES_PRISMA_URL=...
POSTGRES_URL_NON_POOLING=...
```

Zusätzlich noch:
```env
DASHBOARD_PASSWORD=demo123
DATA_RETENTION_DAYS=30
NODE_ENV=production
```

## 📋 Database Schema

### Visitors Table
```sql
- id (SERIAL PRIMARY KEY)
- ip_address (TEXT UNIQUE) - Cookie-based oder real IP
- company_name, country, city, isp - IP Lookup Daten
- is_bot, is_isp (INTEGER) - Filtering Flags
- first_seen, last_seen (BIGINT) - Timestamps
- lookup_cached_at (BIGINT) - Cache für IP Lookups
```

### Page Views Table
```sql
- id (SERIAL PRIMARY KEY)
- visitor_id (FK → visitors)
- page_url, referrer, user_agent
- viewed_at (BIGINT)
- duration (INTEGER)
```

### Session Recordings Table
```sql
- id (SERIAL PRIMARY KEY)
- session_id (TEXT UNIQUE)
- visitor_id (FK → visitors)
- page_url (TEXT)
- events (JSONB) - rrweb event array
- duration, page_count
- completed (BOOLEAN)
- created_at, updated_at (TIMESTAMPTZ)
```

### Click Events Table (Heatmaps)
```sql
- id (SERIAL PRIMARY KEY)
- visitor_id (FK → visitors)
- session_id, page_url
- x, y (INTEGER) - Click Koordinaten
- viewport_width, viewport_height
- element_selector, element_text
- created_at (TIMESTAMPTZ)
```

### Scroll Events Table (Heatmaps)
```sql
- id (SERIAL PRIMARY KEY)
- visitor_id (FK → visitors)
- session_id, page_url
- scroll_depth, max_scroll_depth (INTEGER - Prozent)
- viewport_height, page_height
- created_at (TIMESTAMPTZ)
```

### Funnels Table
```sql
- id (SERIAL PRIMARY KEY)
- name, description
- steps (JSONB) - Array von Funnel Steps
- created_at, updated_at (TIMESTAMPTZ)
```

### Funnel Events Table
```sql
- id (SERIAL PRIMARY KEY)
- funnel_id (FK → funnels)
- visitor_id (FK → visitors)
- step_index, step_name, page_url
- completed_at (TIMESTAMPTZ)
```

## 🔧 Modified Files

```
✓ lib/db.ts - Komplettes DB Schema mit allen Tables
✓ app/api/track/route.ts - Von Memory → Postgres
✓ scripts/setup-db.js - DB Setup Script
✓ package.json - npm script für db:setup
```

## ⚡ Performance

**Indexes erstellt für:**
- Visitor Last Seen (für "Active Now")
- Page Views Time (für Recent Activity)
- Click/Scroll Events Page URL (für Heatmaps)
- Session Recordings Created (für Replay List)
- Funnel Events (für Analytics)

**Optimierungen:**
- Rate Limiting in-memory (kein DB Overhead)
- JSONB für flexible Event Storage
- Foreign Keys mit CASCADE DELETE
- Prepared Statements via @vercel/postgres

## 🧪 Testing

### 1. Tracking Script testen
```html
<script src="https://leadtracker-ivory.vercel.app/track.js" async></script>
```

### 2. API Endpoints testen
```bash
# Track pageview
curl -X POST https://leadtracker-ivory.vercel.app/api/track \
  -H "Content-Type: application/json" \
  -d '{"visitor_id":"test-123","url":"https://example.com","timestamp":1234567890}'

# Get visitors
curl https://leadtracker-ivory.vercel.app/api/visitors

# Get sessions
curl https://leadtracker-ivory.vercel.app/api/sessions
```

### 3. Dashboard checken
→ https://leadtracker-ivory.vercel.app/dashboard

## 📈 Data Retention

Default: 30 Tage (via `DATA_RETENTION_DAYS`)

Cleanup Job: `/api/cleanup` (kann via Vercel Cron aufgerufen werden)

## 🔐 Security

- ✅ Rate Limiting (100 req/min per IP)
- ✅ Dashboard Password Protection
- ✅ CORS Enabled für Tracking
- ✅ SQL Injection Protection via @vercel/postgres
- ✅ Do Not Track respektiert

## 🎯 Migration Complete!

**Vorher:** Daten verloren bei jedem Deploy  
**Nachher:** Persistente Daten in Neon Postgres ✨

Alle Features jetzt Production-Ready:
- ✅ Visitor Tracking
- ✅ Session Recordings  
- ✅ Heatmaps (Click + Scroll)
- ✅ Conversion Funnels
- ✅ Real-time Dashboard

---

**Nächste Schritte:**
1. Deploy zu Vercel: `vercel --prod`
2. DB initialisieren: `curl https://your-domain/api/init-db`
3. Tracking Script auf Website einbauen
4. Dashboard aufrufen und Daten beobachten! 🚀
