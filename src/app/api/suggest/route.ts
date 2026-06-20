import { NextRequest, NextResponse } from "next/server";
import { getCatalogSuggestions } from "@/lib/search";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q") ?? "";
  const suggestions = getCatalogSuggestions(query);
  return NextResponse.json({ suggestions: suggestions.slice(0, 8) });
}
