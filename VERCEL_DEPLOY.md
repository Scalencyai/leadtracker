# 🚀 Vercel Deployment Guide - LeadTracker

## 🎯 Neon Postgres Setup in Vercel

### Schritt 1: Neon Datenbank in Vercel verbinden

1. **Öffne Vercel Dashboard:**
   → https://vercel.com/scalencyai/leadtracker

2. **Gehe zu Storage:**
   - Click auf **Settings** → **Storage** Tab
   - Oder direkt: https://vercel.com/scalencyai/leadtracker/settings/storage

3. **Connect Neon Postgres:**
   - Click **Create Database** oder **Connect Existing**
   - Wähle **Neon** als Provider
   - Wähle deine existierende Neon DB oder erstelle eine neue
   - Vercel erstellt automatisch diese Environment Variables:
     ```
     POSTGRES_URL
     POSTGRES_PRISMA_URL  
     POSTGRES_URL_NON_POOLING
     POSTGRES_USER
     POSTGRES_HOST
     POSTGRES_PASSWORD
     POSTGRES_DATABASE
     ```

### Schritt 2: Zusätzliche Environment Variables setzen

**Im Vercel Dashboard:**  
Settings → Environment Variables

```env
# Dashboard Password
DASHBOARD_PASSWORD=demo123

# Data Retention (in Tagen)
DATA_RETENTION_DAYS=30

# Node Environment
NODE_ENV=production
```

Für **alle Environments** setzen (Production, Preview, Development)

### Schritt 3: Database initialisieren

**Nach dem ersten Deploy:**

```bash
# Option A - Via API Call
curl https://leadtracker-ivory.vercel.app/api/init-db

# Option B - Via Vercel CLI
vercel env pull .env.local
npm run db:setup
```

Die Response sollte sein:
```json
{
  "success": true,
  "message": "Database initialized successfully! All tables created."
}
```

## 📦 Deployment

### Option 1: Git Push (Automatisch)

```bash
git add .
git commit -m "✨ Neon Postgres Integration"
git push origin main
```

Vercel deployed automatisch! ✨

### Option 2: Vercel CLI (Manuell)

```bash
# Production Deploy
vercel --prod

# Preview Deploy
vercel
```

## 🔍 Nach dem Deploy

### 1. Check Database Connection

```bash
curl https://leadtracker-ivory.vercel.app/api/init-db
```

### 2. Test Tracking

```bash
curl -X POST https://leadtracker-ivory.vercel.app/api/track \
  -H "Content-Type: application/json" \
  -d '{
    "visitor_id": "test-visitor-123",
    "url": "https://example.com/test",
    "timestamp": '$(date +%s)000'
  }'
```

### 3. Open Dashboard

→ https://leadtracker-ivory.vercel.app/dashboard

Password: `demo123` (oder dein DASHBOARD_PASSWORD)

## 🐛 Troubleshooting

### Error: "Database connection failed"

**Checke:**
1. Neon DB ist **nicht paused** (Neon pausiert nach Inaktivität)
2. `POSTGRES_URL` ist korrekt gesetzt in Vercel
3. Neon IP Allowlist erlaubt Vercel (sollte default sein)

**Fix:**
```bash
# Vercel CLI
vercel env ls

# Sollte POSTGRES_URL zeigen
# Falls nicht:
vercel env add POSTGRES_URL
```

### Error: "Table does not exist"

**DB nicht initialisiert!**

```bash
# Initialisiere DB:
curl https://leadtracker-ivory.vercel.app/api/init-db
```

### Error: "Rate limit exceeded"

**Rate Limiter ist aktiv (100 req/min per IP)**

Normal! Warte 1 Minute oder disable in `app/api/track/route.ts`

## 🌍 Environment Variables Übersicht

### Auto-created by Vercel (via Neon Integration):
```env
POSTGRES_URL=postgresql://user:pass@...neon.tech/db
POSTGRES_PRISMA_URL=postgresql://user:pass@...neon.tech/db?pgbouncer=true
POSTGRES_URL_NON_POOLING=postgresql://user:pass@...neon.tech/db
```

### Manuell setzen:
```env
DASHBOARD_PASSWORD=demo123
DATA_RETENTION_DAYS=30
NODE_ENV=production
```

### Nicht benötigt (alt):
```env
# Diese NICHT setzen (nur für lokales Render.com Testing):
DATABASE_URL  # Replaced by POSTGRES_URL
```

## 📊 Monitoring

### Vercel Analytics

→ https://vercel.com/scalencyai/leadtracker/analytics

Sieh:
- Deployment Status
- Function Execution Time
- Error Rate

### Neon Console

→ https://console.neon.tech

Sieh:
- Database Size
- Active Connections
- Query Performance

## ✅ Deployment Checklist

- [ ] Neon Postgres verbunden in Vercel Storage
- [ ] `POSTGRES_URL` Environment Variable gesetzt
- [ ] `DASHBOARD_PASSWORD` gesetzt
- [ ] Git pushed zu main branch
- [ ] Deploy successful
- [ ] `/api/init-db` aufgerufen → success
- [ ] Dashboard aufrufbar
- [ ] Test Tracking funktioniert
- [ ] Daten erscheinen in Dashboard

## 🎉 Done!

LeadTracker läuft jetzt auf Vercel mit Neon Postgres! 🚀

**Produktions-URLs:**
- Dashboard: https://leadtracker-ivory.vercel.app/dashboard
- Tracking Script: https://leadtracker-ivory.vercel.app/track.js
- API: https://leadtracker-ivory.vercel.app/api/*

---

**Nächste Schritte:**
1. Tracking Script auf deiner Website einbauen
2. Custom Domain verbinden (optional)
3. Monitoring einrichten
4. Profit! 💰
