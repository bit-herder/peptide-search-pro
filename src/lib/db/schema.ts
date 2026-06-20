export const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS providers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  website TEXT NOT NULL,
  logo_url TEXT,
  trust_score REAL DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  last_scraped_at TEXT,
  profile_json TEXT,
  enriched_at TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  provider_id INTEGER NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
  external_id TEXT,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  peptide_key TEXT NOT NULL,
  dosage_mg REAL,
  dosage_label TEXT,
  price REAL NOT NULL,
  price_per_mg REAL,
  currency TEXT DEFAULT 'USD',
  in_stock INTEGER DEFAULT 1,
  product_url TEXT NOT NULL,
  image_url TEXT,
  purity TEXT,
  has_coa INTEGER DEFAULT 0,
  scraped_at TEXT DEFAULT (datetime('now')),
  UNIQUE(provider_id, external_id)
);

CREATE TABLE IF NOT EXISTS peptide_aliases (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  peptide_key TEXT NOT NULL,
  alias TEXT NOT NULL,
  UNIQUE(peptide_key, alias)
);

CREATE TABLE IF NOT EXISTS scrape_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  provider_slug TEXT NOT NULL,
  status TEXT NOT NULL,
  products_found INTEGER DEFAULT 0,
  error_message TEXT,
  duration_ms INTEGER,
  scraped_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_products_peptide_key ON products(peptide_key);
CREATE INDEX IF NOT EXISTS idx_products_price ON products(price);
CREATE INDEX IF NOT EXISTS idx_products_price_per_mg ON products(price_per_mg);
CREATE INDEX IF NOT EXISTS idx_peptide_aliases_alias ON peptide_aliases(alias);

CREATE TABLE IF NOT EXISTS price_alerts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL,
  peptide_key TEXT NOT NULL,
  alert_type TEXT NOT NULL DEFAULT 'price_per_mg',
  target_value REAL NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  UNIQUE(email, peptide_key, alert_type)
);

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);
`;

export function schemaStatements(): string[] {
  return SCHEMA_SQL.split(";")
    .map((s) => s.trim())
    .filter(Boolean);
}
