import { NextRequest, NextResponse } from "next/server";
import {
  getBestValueDeals,
  getCategoryDeals,
  getPriceDrops,
  getBulkDiscounts,
  getAllDeals,
} from "@/lib/deals";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const type = searchParams.get("type") ?? "all";
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "10", 10), 50);

  try {
    switch (type) {
      case "best_value": {
        const deals = await getBestValueDeals(limit);
        return NextResponse.json({
          type: "best_value",
          deals,
          total: deals.length,
        });
      }
      case "category_deals": {
        const deals = await getCategoryDeals(limit);
        return NextResponse.json({
          type: "category_deals",
          deals,
          total: deals.length,
        });
      }
      case "price_drops": {
        const deals = await getPriceDrops(limit);
        return NextResponse.json({
          type: "price_drops",
          deals,
          total: deals.length,
        });
      }
      case "bulk_discounts": {
        const deals = await getBulkDiscounts(limit);
        return NextResponse.json({
          type: "bulk_discounts",
          deals,
          total: deals.length,
        });
      }
      case "all":
      default: {
        const result = await getAllDeals(limit);
        return NextResponse.json({
          type: "all",
          ...result,
        });
      }
    }
  } catch (error) {
    console.error("Error fetching deals:", error);
    return NextResponse.json(
      { error: "Failed to fetch deals" },
      { status: 500 }
    );
  }
}
