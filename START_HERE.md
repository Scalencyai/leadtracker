# 🚀 LeadTracker - Start Here

## Quick Start (30 seconds)

### 1. The app is ALREADY RUNNING! 🎉
```
✅ Development server: http://localhost:3000
✅ Password: demo123
```

### 2. Open Dashboard
1. Click: http://localhost:3000
2. Enter password: **demo123**
3. You're in! 🎊

### 3. Test It (1 minute)
1. In dashboard, click **"Get Tracking Script"**
2. Open `test-page.html` in your browser
3. Watch the dashboard update in realtime! ✨

---

## What You Got

### ✅ All 7 User Stories Complete
1. **Install Tracking Script** - Copy-paste script generator
2. **Realtime Dashboard** - Live visitor updates (2s refresh)
3. **Reverse IP Lookup** - Automatic company identification
4. **Visitor Details** - Click any row to see full history
5. **Filters & Search** - Filter by country, date, active status
6. **CSV Export** - Download visitor data for CRM
7. **Bot Filtering** - Hide bots & ISPs automatically

### 🛠️ Tech Stack
- Next.js 14 + App Router
- TypeScript (strict mode)
- TailwindCSS + Dark Mode
- SQLite Database
- Server-Sent Events (realtime)
- ipapi.co (IP lookup)

### 📁 Important Files
- `README.md` - Full documentation
- `IMPLEMENTATION.md` - Technical details
- `COMPLETION_REPORT.md` - Task report
- `test-page.html` - Test/demo page
- `TASK_COMPLETE.md` - Summary

---

## Common Tasks

### Stop the Server
```bash
# Find the process
lsof -ti:3000 | xargs kill

# Or use npm
cd ~/Development/leadtracker
npm run dev  # Will stop if running
```

### Restart the Server
```bash
cd ~/Development/leadtracker
npm run dev
```

### Build for Production
```bash
cd ~/Development/leadtracker
npm run build
npm start
```

### Change Password
Edit `.env.local`:
```env
DASHBOARD_PASSWORD=your_new_password
```

---

## Features to Try

### 1. Realtime Updates
- Open dashboard in one tab
- Open test-page.html in another
- Watch it appear instantly! (green "Active Now" badge)

### 2. Visitor Details
- Click any visitor row
- See full page history
- View traffic source
- Check session duration

### 3. Filters
- Search by company name or IP
- Filter by country
- Toggle "Active Now" only
- Toggle "Hide Bots & ISPs"

### 4. Export
- Click "Export CSV"
- Opens in Excel/Sheets
- Ready for CRM import

---

## File Structure

```
leadtracker/
├── app/
│   ├── api/              # API endpoints
│   ├── dashboard/        # Main app
│   └── login/            # Auth
├── components/           # React components
├── lib/
│   ├── db.ts            # Database
│   └── ip-lookup.ts     # IP lookup + bots
├── public/
│   └── track.js         # Tracking script
└── test-page.html       # Demo page
```

---

## Support & Docs

- **Full Guide:** See `README.md`
- **Tech Details:** See `IMPLEMENTATION.md`
- **Task Report:** See `COMPLETION_REPORT.md`

---

## Deployment

### Recommended: Railway
```bash
# Build the app
npm run build

# Deploy (Railway will auto-detect Next.js)
# Set DASHBOARD_PASSWORD in environment variables
```

### Alternative: VPS
```bash
# SSH to server
git clone <your-repo>
cd leadtracker
npm install
npm run build
npm start

# Use PM2 for process management
pm2 start npm --name "leadtracker" -- start
```

---

## 🎯 What's Working

✅ Realtime dashboard (2-second updates)  
✅ IP-to-company lookup  
✅ Bot/ISP filtering  
✅ Visitor tracking  
✅ Detail panels  
✅ Filters & search  
✅ CSV export  
✅ Password auth  
✅ Dark mode  
✅ Mobile responsive  
✅ Production build  

---

## 🔥 Quick Commands

```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Install dependencies
npm install
```

---

**🎊 Everything is ready to go! Just open http://localhost:3000 and start tracking! 🎊**

---

## Need Help?

1. Check `README.md` for detailed docs
2. See `test-page.html` for working example
3. Review `IMPLEMENTATION.md` for technical details

**The app is LIVE and RUNNING right now!** 🚀
