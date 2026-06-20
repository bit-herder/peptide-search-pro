import path from "path";
import fs from "fs";
import { createRequire } from "module";
import { createClient, type Client } from "@libsql/client";
import { schemaStatements } from "./schema";
import { runProviderMigrations } from "./migrations";

export type SqlRow = Record<string, unknown>;

export interface DbAdapter {
  initSchema(): Promise<void>;
  get<T = SqlRow>(sql: string, params?: unknown[]): Promise<T | undefined>;
  all<T = SqlRow>(sql: string, params?: unknown[]): Promise<T[]>;
  run(sql: string, params?: unknown[]): Promise<{ lastInsertRowid: number }>;
  exec(sql: string): Promise<void>;
}

class TursoAdapter implements DbAdapter {
  constructor(private client: Client) {}

  async initSchema(): Promise<void> {
    for (const statement of schemaStatements()) {
      await this.client.execute(statement);
    }
    await runProviderMigrations(this);
  }

  async get<T = SqlRow>(sql: string, params: unknown[] = []): Promise<T | undefined> {
    const result = await this.client.execute({ sql, args: params as never[] });
    return (result.rows[0] as T | undefined) ?? undefined;
  }

  async all<T = SqlRow>(sql: string, params: unknown[] = []): Promise<T[]> {
    const result = await this.client.execute({ sql, args: params as never[] });
    return result.rows as T[];
  }

  async run(sql: string, params: unknown[] = []): Promise<{ lastInsertRowid: number }> {
    const result = await this.client.execute({ sql, args: params as never[] });
    return { lastInsertRowid: Number(result.lastInsertRowid ?? 0) };
  }

  async exec(sql: string): Promise<void> {
    for (const statement of sql
      .split(";")
      .map((s) => s.trim())
      .filter(Boolean)) {
      await this.client.execute(statement);
    }
  }
}

class SqliteAdapter implements DbAdapter {
  private db: import("better-sqlite3").Database;

  constructor(dbPath: string) {
    const rootRequire = createRequire(import.meta.url);
    const Database = rootRequire("better-sqlite3") as typeof import("better-sqlite3");
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    this.db = new Database(dbPath);
    this.db.pragma("journal_mode = WAL");
    this.db.pragma("foreign_keys = ON");
  }

  async initSchema(): Promise<void> {
    for (const statement of schemaStatements()) {
      this.db.exec(statement);
    }
    await runProviderMigrations(this);
  }

  async get<T = SqlRow>(sql: string, params: unknown[] = []): Promise<T | undefined> {
    return this.db.prepare(sql).get(...params) as T | undefined;
  }

  async all<T = SqlRow>(sql: string, params: unknown[] = []): Promise<T[]> {
    return this.db.prepare(sql).all(...params) as T[];
  }

  async run(sql: string, params: unknown[] = []): Promise<{ lastInsertRowid: number }> {
    const result = this.db.prepare(sql).run(...params);
    return { lastInsertRowid: Number(result.lastInsertRowid) };
  }

  async exec(sql: string): Promise<void> {
    this.db.exec(sql);
  }
}

let adapter: DbAdapter | null = null;

function getDataDir(): string {
  if (process.env.PEPTIDE_DATA_DIR) {
    return process.env.PEPTIDE_DATA_DIR;
  }
  return path.join(process.cwd(), "data");
}

export function isTursoMode(): boolean {
  return Boolean(process.env.TURSO_DATABASE_URL);
}

export async function getAdapter(): Promise<DbAdapter> {
  if (adapter) return adapter;

  const tursoUrl = process.env.TURSO_DATABASE_URL;
  if (tursoUrl) {
    const client = createClient({
      url: tursoUrl,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });
    adapter = new TursoAdapter(client);
  } else {
    const dbPath = path.join(getDataDir(), "peptides.db");
    adapter = new SqliteAdapter(dbPath);
  }

  await adapter.initSchema();
  return adapter;
}
