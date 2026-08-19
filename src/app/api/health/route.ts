import { NextResponse } from "next/server";
import { getAdapter } from "@/lib/db/adapter";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const db = await getAdapter();
    await db.get<{ one: number }>("SELECT 1 as one");
    return NextResponse.json(
      { status: "ok", timestamp: new Date().toISOString() },
      { status: 200 },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { status: "degraded", error: "db unavailable", detail: message },
      { status: 503 },
    );
  }
}
