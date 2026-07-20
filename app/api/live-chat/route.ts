import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { sendMessage } from "@/lib/telegramApi";
import { TELEGRAM_ADMIN_ID } from "@/lib/telegramBotConfig";

export const dynamic = "force-dynamic";

function getToken(req: NextRequest) {
  const auth = req.headers.get("authorization") || "";
  return auth.replace(/^Bearer\s+/i, "").trim();
}

async function requireUser(req: NextRequest) {
  const token = getToken(req);
  if (!token) return null;
  const admin = getSupabaseAdmin();
  const { data, error } = await admin.auth.getUser(token);
  if (error || !data?.user) return null;
  return data.user;
}

// GET: the logged-in member's own live-chat thread, oldest first.
export async function GET(req: NextRequest) {
  const user = await requireUser(req);
  if (!user) return NextResponse.json({ success: false, message: "Sesi tidak valid" }, { status: 401 });

  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("qco2_live_chat_messages")
    .select("id, sender, message, created_at")
    .eq("auth_user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(200);

  if (error) return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  return NextResponse.json({ success: true, messages: data || [] });
}

// POST: member sends a message. Saved to the thread AND DM'd to the admin's Telegram
// with a live-chat marker -- the admin just taps "Reply" on that Telegram DM and
// whatever they type gets routed straight back into this member's thread (see the
// reply_to_message handler in app/api/telegram-webhook/route.ts).
export async function POST(req: NextRequest) {
  const user = await requireUser(req);
  if (!user) return NextResponse.json({ success: false, message: "Sesi tidak valid" }, { status: 401 });

  const body = await req.json();
  const message = (body.message || "").trim().slice(0, 1000);
  if (!message) return NextResponse.json({ success: false, message: "Pesan wajib diisi" }, { status: 400 });

  const admin = getSupabaseAdmin();

  const { data: saved, error } = await admin
    .from("qco2_live_chat_messages")
    .insert({ auth_user_id: user.id, sender: "member", message })
    .select()
    .single();
  if (error) return NextResponse.json({ success: false, message: error.message }, { status: 500 });

  const { data: profile } = await admin
    .from("qco2_profiles")
    .select("full_name")
    .eq("auth_user_id", user.id)
    .maybeSingle();
  const label = profile?.full_name || user.email || "Member";

  const dmText = `💬 <b>LIVE CHAT — ${label}</b>\n${user.email || ""}\n━━━━━━━━━━━━━━━━\n\n${message}\n\n↩️ <i>Reply pesan ini di Telegram untuk balas langsung ke user.</i>`;
  const sent = await sendMessage(TELEGRAM_ADMIN_ID, dmText).catch(() => null);
  const tgMessageId = sent?.result?.message_id;
  if (tgMessageId) {
    await admin.from("qco2_live_chat_tg_map").insert({ tg_message_id: tgMessageId, auth_user_id: user.id });
  }

  return NextResponse.json({ success: true, item: saved });
}
