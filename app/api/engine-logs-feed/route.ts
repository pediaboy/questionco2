import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const pair = searchParams.get("pair");
    const action = searchParams.get("action");
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    
    const offset = (page - 1) * limit;
    const admin = getSupabaseAdmin();

    let query = admin
      .from("qco2_engine_logs")
      .select("id, pair, action, confidence, direction, reasoning, created_at", { count: "exact" });

    if (pair && pair !== "ALL") {
      query = query.eq("pair", pair);
    }
    if (action && action !== "ALL") {
      query = query.eq("action", action);
    }

    const { data, count, error } = await query
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    const total = count || 0;
    const hasMore = offset + limit < total;

    return NextResponse.json({
      success: true,
      logs: data || [],
      total,
      page,
      limit,
      hasMore,
    });
  } catch (err) {
    return NextResponse.json({ success: false, error: (err as Error).message }, { status: 500 });
  }
}
