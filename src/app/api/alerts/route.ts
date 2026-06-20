import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { createPriceAlert } from "@/lib/db";
import { PEPTIDE_CATALOG } from "@/lib/peptides";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const peptide_key = String(body.peptide_key ?? "").trim();
    const alert_type = body.alert_type === "price" ? "price" : "price_per_mg";
    const target_value = parseFloat(body.target_value);

    if (!PEPTIDE_CATALOG[peptide_key]) {
      return NextResponse.json({ error: "Unknown peptide" }, { status: 400 });
    }
    if (!target_value || target_value <= 0) {
      return NextResponse.json({ error: "Invalid target value" }, { status: 400 });
    }

    await createPriceAlert({
      email: session.email,
      peptide_key,
      alert_type,
      target_value,
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed to save alert" }, { status: 500 });
  }
}
