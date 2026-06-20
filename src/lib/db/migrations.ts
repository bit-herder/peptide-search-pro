import type { DbAdapter } from "./adapter";
import type { ProviderProfile } from "../scraper/profile-types";

const MIGRATIONS = [
  "ALTER TABLE providers ADD COLUMN profile_json TEXT",
  "ALTER TABLE providers ADD COLUMN enriched_at TEXT",
];

export async function runProviderMigrations(db: DbAdapter): Promise<void> {
  for (const sql of MIGRATIONS) {
    try {
      await db.exec(sql);
    } catch {
      // column already exists
    }
  }
}

export function parseProviderProfile(json: string | null | undefined): ProviderProfile | null {
  if (!json) return null;
  try {
    const data = JSON.parse(json) as ProviderProfile;
    if (data?.version === 1 && data.catalog) return data;
    return null;
  } catch {
    return null;
  }
}
