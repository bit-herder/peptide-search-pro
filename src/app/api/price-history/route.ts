import { NextRequest, NextResponse } from "next/server";
import { getAdapter } from "@/lib/db/adapter";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const peptide = searchParams.get("peptide");
  const limit = parseInt(searchParams.get("limit") ?? "30", 10);

  if (!peptide) {
    return NextResponse.json(
      { error: "Missing required query parameter: peptide" },
      { status: 400 }
    );
  }

  try {
    const db = await getAdapter();
    const rows = await db.all<{
      date: string;
      provider_name: string;
      price_per_mg: number;
    }>(
      `SELECT DATE(p.scraped_at) AS date,
              pr.name AS provider_name,
              MIN(p.price_per_mg) AS price_per_mg
       FROM products p
       JOIN providers pr ON p.provider_id = pr.id
       WHERE p.peptide_key = ? AND p.in_stock = 1 AND pr.is_active = 1
         AND p.price_per_mg IS NOT NULL
       GROUP BY DATE(p.scraped_at), pr.name
       ORDER BY date DESC
       LIMIT ?`,
      [peptide, limit]
    );

    return NextResponse.json({
      peptide,
      history: rows,
    });
  } catch (error) {
    console.error("Error fetching price history:", error);
    return NextResponse.json(
      { error: "Failed to fetch price history" },
      { status: 500 }
    );
  }
}
