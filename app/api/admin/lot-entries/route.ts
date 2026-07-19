import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

// GET: all profiles (for the picker) + the most recent entries feed.
export async function GET() {
  const admin = getSupabaseAdmin();

  const [{ data: profiles, error: profErr }, { data: entries, error: entErr }] = await Promise.all([
    admin
      .from("qco2_profiles")
      .select("id, full_name, email, total_lot, is_dummy, auto_growth")
      .order("total_lot", { ascending: false }),
    admin
      .from("qco2_lot_entries")
      .select("id, profile_id, pair, lot_size, price, is_auto, created_at")
      .order("created_at", { ascending: false })
      .limit(40),
  ]);

  if (profErr) return NextResponse.json({ success: false, error: profErr.message }, { status: 500 });
  if (entErr) return NextResponse.json({ success: false, error: entErr.message }, { status: 500 });

  // Attach display names to entries for the feed.
  const nameById = new Map((profiles || []).map((p) => [p.id, p.full_name || p.email]));
  const entriesWithName = (entries || []).map((e) => ({
    ...e,
    profile_name: nameById.get(e.profile_id) || "Unknown",
  }));

  return NextResponse.json({ success: true, profiles, entries: entriesWithName });
}

// POST: manually add a single trade entry for a profile (admin-triggered "setup entry").
// Inserts the entry row AND bumps the profile's total_lot by lot_size.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const profile_id = body.profile_id as string;
    const pair = body.pair === "BTCUSDT" ? "BTCUSDT" : "XAUUSD";
    const lot_size = Number(body.lot_size);
    const price = Number(body.price);

    if (!profile_id) return NextResponse.json({ success: false, error: "profile_id wajib." }, { status: 400 });
    if (Number.isNaN(lot_size) || lot_size < 0.01 || lot_size > 1) {
      return NextResponse.json({ success: false, error: "Lot harus antara 0.01 - 1.00" }, { status: 400 });
    }
    if (Number.isNaN(price) || price <= 0) {
      return NextResponse.json({ success: false, error: "Harga tidak valid." }, { status: 400 });
    }

    const admin = getSupabaseAdmin();

    const { data: profile, error: profErr } = await admin
      .from("qco2_profiles")
      .select("id, total_lot")
      .eq("id", profile_id)
      .single();

    if (profErr || !profile) {
      return NextResponse.json({ success: false, error: "Member tidak ditemukan." }, { status: 404 });
    }

    const direction = Math.random() < 0.5 ? "BUY" : "SELL";
    const { data: entry, error: insErr } = await admin
      .from("qco2_lot_entries")
      .insert({ profile_id, pair, lot_size, price, is_auto: false, direction })
      .select()
      .single();

    if (insErr) return NextResponse.json({ success: false, error: insErr.message }, { status: 500 });

    const nextLot = Math.round((Number(profile.total_lot ?? 0) + lot_size) * 100) / 100;
    const { error: updErr } = await admin
      .from("qco2_profiles")
      .update({ total_lot: nextLot, updated_at: new Date().toISOString() })
      .eq("id", profile_id);

    if (updErr) return NextResponse.json({ success: false, error: updErr.message }, { status: 500 });

    return NextResponse.json({ success: true, entry, new_total_lot: nextLot });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
