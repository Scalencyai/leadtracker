# 🎬 Session Recording - Quick Test Guide

## Problem

Vercel Deployment hat Probleme. Hier ist wie du Recording SOFORT testen kannst:

## ✅ Quick Test (5 Minuten)

### 1. Erstelle Test-Seite auf deiner Domain

Erstelle eine `test.html` auf deiner Website:

```html
<!DOCTYPE html>
<html>
<head>
    <title>Recording Test</title>
</head>
<body>
    <h1>Session Recording Test</h1>
    <p>Type, click, scroll - all tracked!</p>
    
    <input type="text" placeholder="Type here...">
    <button onclick="alert('Clicked!')">Click Me</button>
    
    <div style="height: 2000px;">
        Scroll down...
    </div>

    <!-- Recording Scripts -->
    <script src="https://cdn.jsdelivr.net/npm/rrweb@latest/dist/rrweb.min.js"></script>
    <script>
        // Simple inline recording test
        const events = [];
        
        if (typeof rrweb !== 'undefined') {
            console.log('✅ rrweb loaded!');
            
            rrweb.record({
                emit(event) {
                    events.push(event);
                    console.log('📹 Event captured:', event.type);
                },
                sampling: {
                    scroll: 150,
                    input: 'last'
                }
            });
            
            // Log captured events after 5 seconds
            setTimeout(() => {
                console.log('📊 Total events captured:', events.length);
                console.log('Events:', events);
            }, 5000);
        } else {
            console.error('❌ rrweb not loaded!');
        }
    </script>
</body>
</html>
```

### 2. Öffne die Seite

1. Upload `test.html` zu deiner Website
2. Öffne in Browser
3. Öffne Console (F12)

### 3. Schaue in Console

**Wenn es funktioniert:**
```
✅ rrweb loaded!
📹 Event captured: DomContentLoaded
📹 Event captured: FullSnapshot
📹 Event captured: MouseMove
📹 Event captured: Scroll
📊 Total events captured: 25
```

**Wenn es nicht funktioniert:**
```
❌ rrweb not loaded!
```

## 🔧 Troubleshooting

### rrweb lädt nicht?

**Mögliche Gründe:**
1. **Adblocker** - Deaktiviere ihn
2. **CSP Headers** - Erlaube cdn.jsdelivr.net
3. **Netzwerk** - Checke DevTools Network Tab

**Fix:**
```html
<!-- Alternative CDN -->
<script src="https://unpkg.com/rrweb@latest/dist/rrweb.min.js"></script>
```

### Keine Events captured?

**Check:**
1. Console für Errors
2. `typeof rrweb` in Console eingeben (sollte "object" sein)
3. Interagiere mit der Seite (click, type, scroll)

## 🎯 Echtes LeadTracker Setup

Wenn der inline Test funktioniert, hier der echte Code:

```html
<!-- Paste before </body> -->
<script src="https://cdn.jsdelivr.net/npm/rrweb@latest/dist/rrweb.min.js"></script>
<script>
(function() {
  const API_BASE = 'https://leadtracker.vercel.app';
  const SESSION_ID = 'session_' + Date.now();
  const events = [];

  if (typeof rrweb !== 'undefined') {
    rrweb.record({
      emit(event) {
        events.push(event);
      },
      sampling: { scroll: 150, input: 'last' }
    });

    // Send events every 10 seconds
    setInterval(() => {
      if (events.length > 0) {
        fetch(API_BASE + '/api/sessions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            session_id: SESSION_ID,
            page_url: window.location.href,
            events: events,
            duration: Date.now() - parseInt(SESSION_ID.split('_')[1])
          })
        }).then(() => {
          console.log('✅ Recording sent:', events.length, 'events');
          events.length = 0; // Clear
        }).catch(err => {
          console.error('❌ Recording failed:', err);
        });
      }
    }, 10000);

    console.log('✅ LeadTracker recording started');
  } else {
    console.error('❌ rrweb not loaded');
  }
})();
</script>
```

## 📊 Check Dashboard

Nach dem Recording:

1. Gehe zu https://leadtracker.vercel.app/dashboard
2. Click "Sessions" (wenn verfügbar)
3. Sollte deine Session sehen

## Alternative: Manual Check

Check direkt in der DB:

```sql
-- In Neon DB Console
SELECT 
  session_id, 
  page_url, 
  duration,
  array_length(events, 1) as event_count,
  created_at
FROM session_recordings
ORDER BY created_at DESC
LIMIT 10;
```

## 🚀 Wenn alles funktioniert

Dann nutze das offizielle Script:

```html
<script src="https://cdn.jsdelivr.net/npm/rrweb@latest/dist/rrweb.min.js"></script>
<script src="https://leadtracker.vercel.app/leadtracker-advanced.js" defer></script>
```

Gibt dir:
- ✅ Session Recording
- ✅ Heatmaps (Click + Scroll)
- ✅ Funnel Tracking
- ✅ Event Analytics

## 💡 Quick Win

**Willst du NUR Session Recording?**

Nutze den inline Code oben - kein LeadTracker nötig!
- Speichert Events in Variable
- Kannst du an eigenes Backend senden
- 100% Kontrolle

---

**Status:** Test mit inline Code → funktioniert? → Nutze LeadTracker Script
