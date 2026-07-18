import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET() {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("qco2_announcements")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, items: data });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { title, body: content, pinned } = body as { title?: string; body?: string; pinned?: boolean };
  if (!title || !content) {
    return NextResponse.json({ success: false, error: "Judul & isi wajib diisi" }, { status: 400 });
  }
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("qco2_announcements")
    .insert({ title, body: content, pinned: !!pinned })
    .select()
    .single();

  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, item: data });
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ success: false, error: "Missing id" }, { status: 400 });

  const admin = getSupabaseAdmin();
  const { error } = await admin.from("qco2_announcements").delete().eq("id", id);
  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
