import { getAdapter } from "../db/adapter";

export interface User {
  id: number;
  email: string;
  created_at: string;
}

export async function upsertUserByEmail(email: string): Promise<User> {
  const database = await getAdapter();
  await database.run("INSERT OR IGNORE INTO users (email) VALUES (?)", [email]);

  const user = await database.get<User>("SELECT id, email, created_at FROM users WHERE email = ?", [
    email,
  ]);
  if (!user) throw new Error("Failed to create user");
  return user;
}

export async function getUserById(id: number): Promise<User | undefined> {
  const database = await getAdapter();
  return database.get<User>("SELECT id, email, created_at FROM users WHERE id = ?", [id]);
}
