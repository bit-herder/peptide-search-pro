import { NextResponse } from "next/server";
import { getProviderStats } from "@/lib/db";
import { PROVIDERS } from "@/lib/providers-config";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const stats = await getProviderStats();
    // #region agent log
    fetch("http://127.0.0.1:7317/ingest/58851eb1-84ed-43d1-944b-a4bd10cbc3a4", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "3b0996" },
      body: JSON.stringify({
        sessionId: "3b0996",
        runId: "post-fix",
        hypothesisId: "H1-H2",
        location: "src/app/api/stats/route.ts:GET",
        message: "Stats API success",
        data: stats,
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion
    return NextResponse.json({
      providers: PROVIDERS,
      stats,
    });
  } catch (error) {
    // #region agent log
    fetch("http://127.0.0.1:7317/ingest/58851eb1-84ed-43d1-944b-a4bd10cbc3a4", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "3b0996" },
      body: JSON.stringify({
        sessionId: "3b0996",
        runId: "post-fix",
        hypothesisId: "H1-H2",
        location: "src/app/api/stats/route.ts:GET",
        message: "Stats API failed",
        data: { error: error instanceof Error ? error.message : String(error) },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion
    throw error;
  }
}
