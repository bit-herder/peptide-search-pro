import { NextRequest, NextResponse } from "next/server";
import { runAllScrapers, runScraperBySlug } from "@/lib/scraper/engine";
import { seedAliases } from "@/lib/db";
import { PROVIDERS } from "@/lib/providers-config";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await seedAliases();

  let body: { provider?: string } = {};
  try {
    body = await request.json();
  } catch {
    // empty body is fine
  }

  const results = body.provider
    ? await runScraperBySlug(body.provider).then((r) => (r ? [r] : []))
    : await runAllScrapers();

  const totalProducts = results.reduce((sum, r) => sum + r.productsFound, 0);

  return NextResponse.json({
    success: true,
    totalProducts,
    results,
  });
}

export async function GET() {
  return NextResponse.json({
    message: "POST to trigger scrape. Optional body: { provider: 'slug' }",
    trackedProviders: PROVIDERS.filter((p) => p.enabled).length,
    providers: PROVIDERS.filter((p) => p.enabled).map((p) => p.slug),
  });
}
