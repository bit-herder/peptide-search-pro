import { NextResponse } from "next/server";
import { signInWithEmail } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();
    const user = await signInWithEmail(String(email ?? ""));
    return NextResponse.json({ user: { id: user.id, email: user.email } });
  } catch {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }
}
