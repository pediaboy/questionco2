import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const admin = getSupabaseAdmin();
  const { searchParams } = new URL(req.url);
  const pair = searchParams.get("pair");
  const action = searchParams.get("action");
  const q = searchParams.get("q"); // free-text search over reasoning
  const limit = Math.min(300, Number(searchParams.get("limit")) || 150);

  let query = admin.from("qco2_engine_logs").select("*").order("created_at", { ascending: false }).limit(limit);
  if (pair) query = query.eq("pair", pair);
  if (action) query = query.eq("action", action);
  if (q) query = query.ilike("reasoning", `%${q}%`);

  const { data, error } = await query;
  if (error) return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  return NextResponse.json({ success: true, logs: data || [] });
}
