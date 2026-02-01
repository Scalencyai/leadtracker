# 🎬 Session Recording Fix

## ❌ Problem

Session Recording funktionierte nicht weil:
1. **rrweb** lud async (zu spät)
2. **leadtracker-advanced.js** lief bevor rrweb ready war
3. Check `typeof rrweb === 'undefined'` war true → Recording disabled

## ✅ Lösung

### 1. **Retry Mechanism**
Das Script wartet jetzt bis zu 5 Sekunden auf rrweb:

```javascript
// Checks every 100ms, max 50 attempts = 5 seconds
function initSessionRecording() {
  let attempts = 0;
  const maxAttempts = 50;
  
  const checkRRWeb = setInterval(() => {
    attempts++;
    
    if (typeof rrweb !== 'undefined' && rrweb.record) {
      clearInterval(checkRRWeb);
      startRecording(); // ✓ Start!
    } else if (attempts >= maxAttempts) {
      clearInterval(checkRRWeb);
      console.warn('rrweb not loaded after 5s');
    }
  }, 100);
}
```

### 2. **Script Loading Order**

**Vorher:**
```html
<script src="https://cdn.jsdelivr.net/npm/rrweb@latest/dist/rrweb.min.js" async></script>
<script src="/leadtracker-advanced.js" async></script>
```

**Nachher:**
```html
<script src="https://cdn.jsdelivr.net/npm/rrweb@latest/dist/rrweb.min.js"></script>
<script src="/leadtracker-advanced.js" defer></script>
```

**Unterschied:**
- rrweb lädt **SYNC** (blocking) → garantiert zuerst
- leadtracker lädt **DEFER** → nach DOM ready, nach rrweb

### 3. **Test Page**

Neue Test-Seite um Recording zu verifizieren:
```
http://localhost:3000/test-recording.html
```

Zeigt:
- ✅ rrweb loaded status
- Session ID & Visitor ID
- Test interactions (input, button clicks, scroll)
- Console logs zur Diagnose

## 🧪 Testing

### Lokal Testen:

1. **Dev Server starten:**
```bash
cd ~/Development/leadtracker
npm run dev
```

2. **Test-Seite öffnen:**
```
http://localhost:3000/test-recording.html
```

3. **Console checken (F12):**
```
✓ [LeadTracker] Advanced analytics initialized
✓ [LeadTracker] Session recording started
```

4. **Interaktionen testen:**
- Text eintippen
- Buttons klicken
- Scrollen

5. **Database checken:**
```bash
# Check sessions table
curl http://localhost:3000/api/sessions
```

### Production Testen:

1. **Script auf Website einbauen:**
```html
<!-- Paste before </body> -->
<script src="https://cdn.jsdelivr.net/npm/rrweb@latest/dist/rrweb.min.js"></script>
<script src="https://leadtracker.vercel.app/leadtracker-advanced.js" defer></script>
```

2. **Console checken:**
```
✓ [LeadTracker] Advanced analytics initialized
✓ [LeadTracker] Session recording started
```

3. **Dashboard aufrufen:**
```
https://leadtracker.vercel.app/dashboard/sessions
```

## 📊 Was wird getracked?

**Session Recording speichert:**
- ✅ Mouse movements
- ✅ Clicks
- ✅ Scrolling
- ✅ Text input (optional)
- ✅ Page changes
- ✅ Window resizing

**Gesendet alle:**
- 10 Sekunden (während Session)
- Bei page unload (Besucher verlässt Seite)

**Gespeichert als:**
- JSON events in `session_recordings.events` (JSONB)
- Duration, page_count, completed flag

## 🔍 Debugging

### Check if rrweb loaded:
```javascript
// In browser console
typeof rrweb !== 'undefined'  // Should be true
```

### Check localStorage:
```javascript
localStorage.getItem('leadtracker_session_id')
localStorage.getItem('leadtracker_visitor_id')
```

### Check API calls:
```bash
# Network tab → Filter: "/api/sessions"
# Should see POST requests every 10s
```

### Common Issues:

**1. "rrweb not loaded after 5s"**
- CDN blocked (adblocker?)
- Network slow
- CSP policy blocking external scripts

**Fix:** Self-host rrweb or use different CDN

**2. "Session not showing in dashboard"**
- Database connection issue
- CORS error
- Check Vercel logs

**Fix:**
```bash
vercel logs --follow
```

**3. No events captured**
- rrweb.record() not called
- Sampling too aggressive
- Page left before first send (< 10s)

**Fix:** Check console for errors, reduce send interval

## 🎯 Next Steps

### Immediately Available:
- ✅ Recording works after Vercel deploy (1-2 min)
- ✅ Test page at `/test-recording.html`
- ✅ Better error messages

### Optional Enhancements:

**1. Playback UI**
Build replay dashboard:
```typescript
// components/SessionPlayer.tsx
import rrwebPlayer from 'rrweb-player';

function SessionPlayer({ events }) {
  useEffect(() => {
    new rrwebPlayer({
      target: document.getElementById('player'),
      props: { events }
    });
  }, [events]);
}
```

**2. Privacy Controls**
Mask sensitive data:
```javascript
rrweb.record({
  maskAllInputs: true,  // Hide input values
  maskTextSelector: '.private',  // Hide elements with class
  blockSelector: '.sensitive'  // Don't record these elements
});
```

**3. Compression**
Reduce storage:
```javascript
import { pack } from 'rrweb';
const packed = pack(events);  // Smaller payload
```

## 📝 Summary

| Before | After |
|--------|-------|
| ❌ Recording failed silently | ✅ Waits for rrweb (5s) |
| ❌ No error messages | ✅ Clear console warnings |
| ❌ Async loading issues | ✅ Proper script order |
| ❌ No test page | ✅ `/test-recording.html` |

**Status:** ✅ FIXED - Deploy and test!

---

**Testing URL:** https://leadtracker.vercel.app/test-recording.html  
**Dashboard:** https://leadtracker.vercel.app/dashboard/sessions
