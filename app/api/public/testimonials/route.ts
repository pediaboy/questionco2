import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

// Only returns admin-published testimonials. No fabricated reviews -- if
// nothing has been published yet, this returns an empty array and the page
// shows an honest "belum ada testimoni" state instead of fake quotes.
export async function GET() {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("qco2_testimonials")
    .select("name, role, message, rating, created_at")
    .eq("is_published", true)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  return NextResponse.json({ success: true, items: data || [] });
}
