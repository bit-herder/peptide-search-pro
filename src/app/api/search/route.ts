import { NextRequest, NextResponse } from "next/server";
import { getProviderStats } from "@/lib/db";
import { searchPeptidesWithDiscovery, SortOption } from "@/lib/search";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const query = searchParams.get("q") ?? "";
  const sort = (searchParams.get("sort") as SortOption) ?? "price_per_mg";
  const inStockOnly = searchParams.get("in_stock") !== "false";
  const discover = searchParams.get("discover") !== "false";
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "100", 10), 200);

  const results = await searchPeptidesWithDiscovery({
    query,
    sort,
    inStockOnly,
    limit,
    discover,
  });
  const stats = await getProviderStats();

  return NextResponse.json({ ...results, stats });
}
