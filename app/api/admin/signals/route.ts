import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

// GET: all signals (any status), newest first — for the admin management table.
export async function GET() {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("qco2_signals")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, items: data });
}

// POST: create a new signal. Goes live instantly for members (dashboard/sinyal polls every 5s).
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const pair = (body.pair || "").trim().toUpperCase();
    const direction = body.direction === "SELL" ? "SELL" : "BUY";
    const entry = Number(body.entry);
    const stop_loss = Number(body.stop_loss);
    const take_profit = Number(body.take_profit);
    const status = body.status || "active";
    const audience = body.audience === "public" ? "public" : "vip";

    if (!pair) return NextResponse.json({ success: false, error: "Pair wajib diisi." }, { status: 400 });
    if (Number.isNaN(entry) || Number.isNaN(stop_loss) || Number.isNaN(take_profit)) {
      return NextResponse.json({ success: false, error: "Entry/SL/TP harus berupa angka." }, { status: 400 });
    }

    const admin = getSupabaseAdmin();
    const { data, error } = await admin
      .from("qco2_signals")
      .insert({ pair, direction, entry, stop_loss, take_profit, status, audience })
      .select()
      .single();

    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, item: data });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}

// PATCH: edit a signal (values or status — e.g. mark tp_hit / sl_hit / closed).
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, pair, direction, entry, stop_loss, take_profit, status, audience } = body as {
      id?: string;
      pair?: string;
      direction?: "BUY" | "SELL";
      entry?: number;
      stop_loss?: number;
      take_profit?: number;
      status?: string;
      audience?: string;
    };

    if (!id) return NextResponse.json({ success: false, error: "Missing id" }, { status: 400 });

    const update: Record<string, unknown> = {};
    if (pair !== undefined) update.pair = pair.trim().toUpperCase();
    if (direction !== undefined) update.direction = direction;
    if (entry !== undefined) update.entry = Number(entry);
    if (stop_loss !== undefined) update.stop_loss = Number(stop_loss);
    if (take_profit !== undefined) update.take_profit = Number(take_profit);
    if (status !== undefined) update.status = status;
    if (audience !== undefined) update.audience = audience;

    const admin = getSupabaseAdmin();
    const { data, error } = await admin
      .from("qco2_signals")
      .update(update)
      .eq("id", id)
      .select()
      .single();

    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, item: data });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}

// DELETE: remove a signal entirely.
export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ success: false, error: "Missing id" }, { status: 400 });

  const admin = getSupabaseAdmin();
  const { error } = await admin.from("qco2_signals").delete().eq("id", id);
  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
