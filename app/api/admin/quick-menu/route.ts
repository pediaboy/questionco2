import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

export async function GET() {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("qco2_quick_menu")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, items: data });
}

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const { id, label, icon_key, href, sort_order, active } = body as {
    id?: string;
    label?: string;
    icon_key?: string;
    href?: string;
    sort_order?: number;
    active?: boolean;
  };

  if (!id) return NextResponse.json({ success: false, error: "Missing id" }, { status: 400 });

  const admin = getSupabaseAdmin();
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (label !== undefined) update.label = label;
  if (icon_key !== undefined) update.icon_key = icon_key;
  if (href !== undefined) update.href = href;
  if (sort_order !== undefined) update.sort_order = sort_order;
  if (active !== undefined) update.active = active;

  const { data, error } = await admin
    .from("qco2_quick_menu")
    .update(update)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, item: data });
}
