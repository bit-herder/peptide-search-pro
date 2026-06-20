import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { getUserById, upsertUserByEmail, type User } from "./users";

const COOKIE_NAME = "psp_session";
const MAX_AGE_SEC = 60 * 60 * 24 * 30; // 30 days

function getSecret(): string {
  return process.env.SESSION_SECRET ?? "dev-session-secret-change-in-production";
}

function sign(value: string): string {
  return createHmac("sha256", getSecret()).update(value).digest("base64url");
}

function encodeSession(userId: number, email: string): string {
  const payload = Buffer.from(
    JSON.stringify({ userId, email, exp: Date.now() + MAX_AGE_SEC * 1000 })
  ).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

function decodeSession(token: string): { userId: number; email: string } | null {
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;

  const expected = sign(payload);
  try {
    const a = Buffer.from(signature);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  } catch {
    return null;
  }

  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as {
      userId: number;
      email: string;
      exp: number;
    };
    if (!data.userId || !data.email || Date.now() > data.exp) return null;
    return { userId: data.userId, email: data.email };
  } catch {
    return null;
  }
}

export async function createSession(user: User): Promise<void> {
  const token = encodeSession(user.id, user.email);
  const jar = await cookies();
  jar.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: MAX_AGE_SEC,
    path: "/",
  });
}

export async function destroySession(): Promise<void> {
  const jar = await cookies();
  jar.delete(COOKIE_NAME);
}

export async function getSessionUser(): Promise<User | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE_NAME)?.value;
  if (!token) return null;

  const decoded = decodeSession(token);
  if (!decoded) return null;

  const user = await getUserById(decoded.userId);
  if (!user || user.email !== decoded.email) return null;
  return user;
}

export async function signInWithEmail(email: string): Promise<User> {
  const normalized = email.trim().toLowerCase();
  if (!normalized || !normalized.includes("@")) {
    throw new Error("Invalid email");
  }
  const user = await upsertUserByEmail(normalized);
  await createSession(user);
  return user;
}
