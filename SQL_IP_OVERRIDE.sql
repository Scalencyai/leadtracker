-- Manual IP Override für Calenso AG
-- Führe das in der Neon DB Console aus (Vercel → Storage → Query)

-- 1. IP Override eintragen
INSERT INTO ip_overrides (ip_start, ip_end, company_name, notes, created_at, updated_at)
VALUES (
  2994675766,  -- 178.174.80.54 als BigInt
  2994675766,
  'Calenso AG',
  'Mike Office IP - Manual Override',
  NOW(),
  NOW()
)
ON CONFLICT (ip_start, ip_end) 
DO UPDATE SET 
  company_name = 'Calenso AG',
  notes = 'Mike Office IP - Manual Override',
  updated_at = NOW();

-- 2. Bestehenden Visitor updaten (falls schon in DB)
UPDATE visitors 
SET company_name = 'Calenso AG',
    is_isp = 0
WHERE ip_address = '178.174.80.54';

-- 3. Checken ob es funktioniert hat
SELECT * FROM ip_overrides WHERE company_name = 'Calenso AG';
SELECT * FROM visitors WHERE ip_address = '178.174.80.54';
