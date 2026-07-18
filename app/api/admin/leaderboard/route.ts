import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

// GET: full leaderboard, ranked by total_lot desc (Kontes Capai Lot) — includes real + dummy accounts.
export async function GET() {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("qco2_profiles")
    .select(
      "id, email, full_name, is_dummy, auto_growth, broker_registered, total_lot, profit_pips, win_rate, total_trade, role"
    )
    .order("total_lot", { ascending: false });

  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, entries: data });
}

// POST: create a dummy leaderboard entry (no real auth user — display-only competitor).
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const full_name = (body.full_name || "").trim();
    const total_lot = Number(body.total_lot ?? 0);
    const profit_pips = Number(body.profit_pips ?? 0);
    const win_rate = Number(body.win_rate ?? 0);
    const total_trade = Number(body.total_trade ?? 0);
    const auto_growth = body.auto_growth !== undefined ? !!body.auto_growth : true;

    if (!full_name) {
      return NextResponse.json({ success: false, error: "Nama wajib diisi." }, { status: 400 });
    }

    const admin = getSupabaseAdmin();
    const dummyEmail = `dummy_${Date.now()}_${Math.random().toString(36).slice(2, 8)}@leaderboard.local`;

    const { data, error } = await admin
      .from("qco2_profiles")
      .insert({
        auth_user_id: null,
        email: dummyEmail,
        full_name,
        role: "free_member",
        is_dummy: true,
        auto_growth,
        total_lot,
        profit_pips,
        win_rate,
        total_trade,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, entry: data });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}

// PATCH: edit a leaderboard entry's stats / name / auto_growth / broker_registered toggle (dummy or real).
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, full_name, total_lot, profit_pips, win_rate, total_trade, auto_growth, broker_registered } = body as {
      id?: string;
      full_name?: string;
      total_lot?: number;
      profit_pips?: number;
      win_rate?: number;
      total_trade?: number;
      auto_growth?: boolean;
      broker_registered?: boolean;
    };

    if (!id) return NextResponse.json({ success: false, error: "Missing id" }, { status: 400 });

    const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (full_name !== undefined) update.full_name = full_name;
    if (total_lot !== undefined) update.total_lot = total_lot;
    if (profit_pips !== undefined) update.profit_pips = profit_pips;
    if (win_rate !== undefined) update.win_rate = win_rate;
    if (total_trade !== undefined) update.total_trade = total_trade;
    if (auto_growth !== undefined) update.auto_growth = auto_growth;
    if (broker_registered !== undefined) update.broker_registered = broker_registered;

    const admin = getSupabaseAdmin();
    const { data, error } = await admin
      .from("qco2_profiles")
      .update(update)
      .eq("id", id)
      .select()
      .single();

    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, entry: data });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}

// DELETE: remove a dummy entry only (real registered accounts can't be deleted from here).
export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ success: false, error: "Missing id" }, { status: 400 });

  const admin = getSupabaseAdmin();

  const { data: row, error: findErr } = await admin
    .from("qco2_profiles")
    .select("is_dummy")
    .eq("id", id)
    .single();

  if (findErr || !row) return NextResponse.json({ success: false, error: "Entry tidak ditemukan." }, { status: 404 });
  if (!row.is_dummy) {
    return NextResponse.json(
      { success: false, error: "Tidak bisa menghapus akun member asli dari sini." },
      { status: 400 }
    );
  }

  const { error } = await admin.from("qco2_profiles").delete().eq("id", id);
  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
