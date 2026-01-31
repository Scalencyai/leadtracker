# LeadTracker - Free B2B Website Visitor Identification

![LeadTracker](https://img.shields.io/badge/License-MIT-blue.svg)
![Next.js](https://img.shields.io/badge/Next.js-14-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)

LeadTracker is a free, open-source alternative to Leadinfo and Leadfeeder. Identify which companies visit your website through reverse IP lookup, enabling your sales team to reach out to warm leads proactively.

## ✨ Features

### Core Features
- 🔴 **Real-time Dashboard** - See companies visiting your site right now using Server-Sent Events
- 🌍 **Reverse IP Lookup** - Automatically identify companies from IP addresses (ipapi.co)
- 📊 **Visitor Analytics** - Track page views, session duration, and visitor behavior
- 🤖 **Bot Filtering** - Automatically detect and filter bot/ISP traffic
- 📥 **CSV Export** - Export visitor data for CRM import or analysis
- 🔐 **Privacy-First** - No cookies, respects DNT, GDPR-friendly
- 🚀 **Lightweight Tracking** - <2KB script, async loading, zero page speed impact
- 💾 **Production-Ready** - Vercel Postgres database, scalable architecture

### 🎬 Advanced Analytics (NEW!)
- **Session Recording & Replay** - Watch exactly how visitors interact with your site (like Hotjar)
- **Conversion Funnel Analytics** - Track multi-step user journeys and identify drop-off points (like Mixpanel)
- **Click & Scroll Heatmaps** - Visualize where users click and scroll on your pages (like Crazy Egg)
- **Event Tracking** - Track custom events, form submissions, and user actions
- **Advanced Visualization** - Sankey diagrams, heatmap overlays, and interactive replays

> 📖 **See [ADVANCED_FEATURES.md](ADVANCED_FEATURES.md) for detailed documentation**

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/leadtracker.git
   cd leadtracker
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Edit `.env.local` and set your dashboard password:
   ```
   DASHBOARD_PASSWORD=your_secure_password
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open the dashboard**
   Navigate to [http://localhost:3000/dashboard](http://localhost:3000/dashboard)

6. **Get your tracking script**
   - Click "Get Tracking Script" in the dashboard
   - Copy the script tag
   - Paste it in your website's HTML before `</body>`

## 📝 Usage

### Installing the Tracking Script

Add this script to your website (replace with your domain):

```html
<script src="https://your-domain.com/track.js" data-api="https://your-domain.com/api/track" async></script>
```

**Common Platforms:**
- **WordPress**: Add to `footer.php` or use "Insert Headers and Footers" plugin
- **Shopify**: Theme → Edit Code → `theme.liquid` → Before `</body>`
- **Webflow**: Project Settings → Custom Code → Footer Code
- **HTML/Static**: Add to your `index.html` before `</body>`

### Dashboard Features

#### Real-time Visitor Tracking
- See companies visiting your site right now (green "Active Now" badge)
- Updates automatically every 2 seconds via Server-Sent Events
- No manual refresh needed

#### Filters
- **Search**: Find visitors by company name or IP address
- **Country**: Filter by visitor location
- **Date Range**: Today, Last 7 days, Last 30 days, All time
- **Active Now**: Show only current visitors (last 5 minutes)
- **Hide Bots & ISPs**: Filter out non-business traffic (default: ON)

#### Visitor Details
- Click any visitor row to see detailed information
- View all pages visited (chronological order)
- See session duration, traffic source, and referrer
- Identify first seen and last seen timestamps

#### Export Data
- Export filtered visitor data to CSV
- Import into your CRM (HubSpot, Salesforce, Pipedrive, etc.)
- Includes: Company, Location, Visit times, Pages viewed

## 🛠️ Tech Stack

- **Frontend**: Next.js 14 (App Router), React, TailwindCSS
- **Backend**: Next.js API Routes, SQLite (better-sqlite3)
- **Real-time**: Server-Sent Events (SSE)
- **IP Lookup**: ipapi.co (free tier: 1000 requests/day)
- **Deployment**: Vercel, Railway, or self-hosted

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DASHBOARD_PASSWORD` | Password to access dashboard | `changeme` |
| `DATA_RETENTION_DAYS` | Days to keep visitor data | `30` |
| `IPAPI_KEY` | Optional ipapi.co API key for higher limits | - |

### Data Retention

By default, visitor data older than 30 days is automatically deleted. Adjust `DATA_RETENTION_DAYS` in `.env.local` to change this.

## 📊 Database Schema

### Visitors Table
```sql
- id (INTEGER PRIMARY KEY)
- ip_address (TEXT UNIQUE)
- company_name (TEXT)
- country (TEXT)
- city (TEXT)
- isp (TEXT)
- is_bot (INTEGER 0/1)
- is_isp (INTEGER 0/1)
- first_seen (INTEGER timestamp)
- last_seen (INTEGER timestamp)
- lookup_cached_at (INTEGER timestamp)
```

### Page Views Table
```sql
- id (INTEGER PRIMARY KEY)
- visitor_id (INTEGER FOREIGN KEY)
- page_url (TEXT)
- referrer (TEXT)
- user_agent (TEXT)
- viewed_at (INTEGER timestamp)
- duration (INTEGER)
```

## 🚀 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import project in Vercel
3. Set environment variables
4. Deploy!

**Note**: Vercel's serverless functions have a 10-second timeout for SSE. For production, consider using a dedicated server.

### Self-Hosted (VPS/Docker)

```bash
# Build for production
npm run build

# Start production server
npm start
```

Or use Docker:
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Inspired by Leadfeeder and Leadinfo
- Built with Next.js 14 and the App Router
- IP lookup powered by ipapi.co

## 🔮 Roadmap

### ✅ Completed
- [x] Session Recording & Replay
- [x] Conversion Funnel Analytics
- [x] Click & Scroll Heatmaps
- [x] Advanced Event Tracking

### 🚧 Planned
- [ ] Email notifications for high-value visitors
- [ ] Slack/Discord webhook integrations
- [ ] Lead scoring based on page views and engagement
- [ ] CRM integrations (HubSpot, Salesforce, Pipedrive)
- [ ] Custom company databases (Clearbit, etc.)
- [ ] AI-powered funnel insights
- [ ] A/B testing heatmap comparison

## 📧 Support

For support, email your-email@example.com or open an issue on GitHub.

---

**Built with ❤️ for the open-source community**
