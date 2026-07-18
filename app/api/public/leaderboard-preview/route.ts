import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

function censorName(name: string): string {
  const clean = name.trim();
  if (clean.length <= 2) return "*".repeat(clean.length || 2);
  const first = clean[0];
  const last = clean[clean.length - 1];
  const middleLength = Math.max(clean.length - 2, 1);
  return `${first}${"*".repeat(middleLength)}${last}`;
}

export async function GET() {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("qco2_profiles")
    .select("email, full_name, total_lot")
    .or("is_dummy.eq.true,broker_registered.eq.true")
    .order("total_lot", { ascending: false })
    .limit(3);

  if (error) return NextResponse.json({ success: false, message: error.message }, { status: 500 });

  const items = (data || []).map((p) => {
    const rawName = p.full_name || (p.email ? p.email.split("@")[0] : "Trader");
    return {
      name: censorName(rawName),
      total_lot: p.total_lot ?? 0,
    };
  });

  return NextResponse.json({ success: true, items });
}
