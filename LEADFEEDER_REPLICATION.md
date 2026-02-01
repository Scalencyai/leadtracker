# 🏗️ Leadfeeder Selbst Nachbauen - Kompletter Guide

## 🎯 Ziel: Leadfeeder Clone (kostenlos!)

**Was Leadfeeder macht:**
- IP → Company Identifikation
- Visitor Tracking auf Website
- Lead Enrichment mit Firmendaten
- Dashboard mit Analytics

**Was wir jetzt bauen:**
→ Alles das, aber **kostenlos** & **self-hosted**!

---

## 🔍 Die 4 Säulen der IP→Company Detection

### 1. **Reverse DNS Lookup** (✅ Implementiert)
```
IP → Hostname → Company
91.214.64.108 → mail.calenso.com → "Calenso"
```

**Accuracy:** 20-30%  
**Cost:** Free  
**Limit:** Keine

### 2. **WHOIS Lookup** (✅ Implementiert)
```
IP → WHOIS Database → Org Name
91.214.64.108 → "Calenso AG"
```

**APIs:**
- ipwhois.app (10k requests/month, free)
- RIPE NCC (unlimited, free!)
- ARIN, APNIC, LACNIC (RIRs)

**Accuracy:** 40-50%  
**Cost:** Free

### 3. **ASN Database** (🔄 Next Step)
```
IP → ASN → Company
91.214.64.108 → AS12345 → "Calenso AG"
```

**Kostenlose Datenbanken:**
- MaxMind GeoLite2 ASN (free)
- Team Cymru ASN Lookup (free)
- RIPE RIS (free)

**Accuracy:** 50-60%

### 4. **Eigene IP Datenbank** (🔄 Next Step)
```
Manuelles Mapping:
185.123.45.0/24 → "Calenso AG"
```

**Strategie:**
- Sammle bekannte IPs über Zeit
- Manuelle Overrides
- Community-Daten (GitHub)
- Machine Learning auf Patterns

**Accuracy:** 90%+ (für bekannte IPs)

---

## 💾 Database Schema für IP Enrichment

### Neue Tabelle: `ip_overrides`

```sql
CREATE TABLE ip_overrides (
  id SERIAL PRIMARY KEY,
  ip_start INET NOT NULL,
  ip_end INET NOT NULL,
  company_name TEXT NOT NULL,
  domain TEXT,
  industry TEXT,
  employee_count TEXT,
  revenue TEXT,
  source TEXT, -- 'manual', 'whois', 'community', 'ml'
  confidence DECIMAL(3,2), -- 0.00-1.00
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ip_overrides_range ON ip_overrides 
  USING GIST (inet_range(ip_start, ip_end));
```

### Neue Tabelle: `asn_database`

```sql
CREATE TABLE asn_database (
  asn INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  company_name TEXT,
  country TEXT,
  ip_ranges JSONB, -- Array of CIDR ranges
  last_updated TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_asn_company ON asn_database(company_name);
```

---

## 🚀 Implementation Roadmap

### Phase 1: Enhanced Lookups (✅ DONE)
- [x] Reverse DNS
- [x] WHOIS (ipwhois.app)
- [x] WHOIS (RIPE NCC)
- [x] Hostname parsing
- [x] ISP filtering

### Phase 2: Database Layer (🔄 IN PROGRESS)
- [ ] Create `ip_overrides` table
- [ ] Create `asn_database` table
- [ ] IP range matching function
- [ ] ASN lookup function
- [ ] Manual override UI

### Phase 3: Data Collection (📋 TODO)
- [ ] MaxMind GeoLite2 ASN import
- [ ] Team Cymru ASN lookup integration
- [ ] GitHub IP lists (awesome-ip-lists)
- [ ] Community contributions
- [ ] Auto-learning from successful matches

### Phase 4: Enrichment (📋 TODO)
- [ ] Company domain extraction
- [ ] LinkedIn company lookup (scraping)
- [ ] Clearbit-like enrichment (free APIs)
- [ ] Employee count estimates
- [ ] Industry classification

### Phase 5: ML Layer (🔮 FUTURE)
- [ ] Train model on collected data
- [ ] Pattern recognition (IP ranges)
- [ ] Confidence scoring
- [ ] Auto-categorization

---

## 📦 Kostenlose Datenquellen

### 1. **MaxMind GeoLite2 ASN**
- Download: https://dev.maxmind.com/geoip/geolite2-free-geolocation-data
- Updates: Weekly
- Format: CSV/MMDB
- License: Creative Commons

### 2. **RIPE NCC Data**
- API: https://stat.ripe.net/docs/data_api
- No auth required!
- Rate limit: 10 req/s
- Coverage: Europe, Middle East

### 3. **ARIN/APNIC/LACNIC**
- ARIN: North America
- APNIC: Asia Pacific  
- LACNIC: Latin America
- All have free WHOIS APIs

### 4. **Team Cymru**
- Free ASN lookup via DNS
- `dig +short 108.64.214.91.origin.asn.cymru.com TXT`
- No API key needed

### 5. **GitHub IP Lists**
- awesome-ip-lists
- company-ip-ranges
- cloud-ip-ranges
- Community-maintained

---

## 🛠️ Tools & Scripts

### ASN Import Script

```javascript
// scripts/import-asn-database.js
const fs = require('fs');
const csv = require('csv-parser');
const { sql } = require('@vercel/postgres');

async function importMaxMindASN() {
  const results = [];
  
  fs.createReadStream('GeoLite2-ASN-Blocks-IPv4.csv')
    .pipe(csv())
    .on('data', (row) => {
      results.push({
        network: row.network,
        asn: parseInt(row.autonomous_system_number),
        name: row.autonomous_system_organization
      });
    })
    .on('end', async () => {
      console.log(`Importing ${results.length} ASN entries...`);
      
      for (const entry of results) {
        await sql`
          INSERT INTO asn_database (asn, name, ip_ranges)
          VALUES (${entry.asn}, ${entry.name}, ${JSON.stringify([entry.network])})
          ON CONFLICT (asn) DO UPDATE
          SET ip_ranges = jsonb_set(
            asn_database.ip_ranges,
            '{-1}',
            to_jsonb(${entry.network})
          )
        `;
      }
      
      console.log('Import complete!');
    });
}

importMaxMindASN();
```

### Manual IP Override UI

```typescript
// app/dashboard/settings/ip-overrides/page.tsx
export default function IPOverridesPage() {
  const [ipStart, setIpStart] = useState('');
  const [ipEnd, setIpEnd] = useState('');
  const [companyName, setCompanyName] = useState('');
  
  async function addOverride() {
    await fetch('/api/admin/ip-overrides', {
      method: 'POST',
      body: JSON.stringify({ ipStart, ipEnd, companyName })
    });
  }
  
  return (
    <div>
      <h1>Manual IP → Company Mapping</h1>
      <input value={ipStart} onChange={e => setIpStart(e.target.value)} placeholder="Start IP" />
      <input value={ipEnd} onChange={e => setIpEnd(e.target.value)} placeholder="End IP" />
      <input value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="Company" />
      <button onClick={addOverride}>Add Override</button>
    </div>
  );
}
```

---

## 📊 Expected Accuracy

| Method | Accuracy | Coverage | Cost |
|--------|----------|----------|------|
| Reverse DNS | 20-30% | All IPs | Free |
| WHOIS | 40-50% | All IPs | Free |
| ASN Database | 50-60% | All IPs | Free |
| Manual Overrides | 95%+ | Known IPs | Time |
| **Combined** | **60-70%** | **All IPs** | **Free** |

**Vs. Leadfeeder:** 85-90% accuracy ($100+/mo)

**The Gap:** 15-20% accuracy difference for:
- VPNs/Proxies
- Dynamic IPs
- Cloud providers
- New companies

---

## 🎯 Next Steps

### Immediate (Today):
1. ✅ WHOIS lookup implemented
2. 🔄 Create database tables
3. 🔄 Import MaxMind ASN data

### Short-term (This Week):
1. Build IP Override UI
2. ASN lookup integration
3. Team Cymru integration
4. GitHub IP lists import

### Long-term (This Month):
1. ML model training
2. Auto-learning from matches
3. Company enrichment
4. LinkedIn integration

---

## 💰 Cost Comparison

| Feature | Leadfeeder | Our Solution |
|---------|------------|--------------|
| IP Tracking | €100/mo | **Free** |
| Company ID | 85% | 60-70% |
| Enrichment | Included | DIY |
| Dashboard | Included | **Built** |
| Data Ownership | No | **Yes!** |
| Customization | Limited | **Full** |
| **Total Cost** | **€1200/year** | **€0/year** |

**Trade-off:** Zeit investieren vs. Geld zahlen

---

## 🚀 Live Implementation

**Current Stack:**
```
1. Reverse DNS (Google DNS-over-HTTPS)
2. ipapi.co (1000/day)
3. WHOIS (ipwhois.app 10k/month)
4. WHOIS (RIPE NCC unlimited)
5. ISP filtering
6. Hostname parsing
```

**Next Addition:**
```
7. IP Override Table (DB)
8. ASN Database (MaxMind)
9. Team Cymru ASN Lookup
10. GitHub Community IPs
```

**Estimated Final Accuracy:** 65-75% (vs. Leadfeeder 85%)

---

## 📝 Conclusion

**Kann man Leadfeeder kostenlos nachbauen?**
→ **JA!** Aber mit Einschränkungen.

**Was fehlt:**
- Proprietäre IP Datenbanken (Jahre aufgebaut)
- Direkter Zugang zu Business-Registern
- ML Models auf Millionen von Datenpunkten

**Was wir haben:**
- Alle kostenlosen Tools kombiniert
- Eigene Datenbank die wächst
- 100% Control & Ownership
- 0€ laufende Kosten

**Empfehlung:**
- Start with free solution
- Sammle Daten über Zeit
- Upgrade to paid wenn Accuracy kritisch wird

**Bottom Line:**
60-70% kostenlos ist besser als 0% für €100/mo! 🎯
