import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import {
  sendMessage,
  editMessageText,
  deleteMessage,
  answerCallbackQuery,
  sendToChannel,
  InlineKeyboard,
} from "@/lib/telegramApi";
import { TELEGRAM_ADMIN_ID, vipChannelId, publicChannelId, SIGNAL_PAIR_OPTIONS, signalStatusKeyboard } from "@/lib/telegramBotConfig";
import { SIGNAL_PAIRS } from "@/lib/signalPairs";
import { getLivePriceForPair } from "@/lib/signalEngine";
import { advanceTp, closeViaSl, advanceBe, decimalsFor } from "@/lib/signalAlerts";

export const dynamic = "force-dynamic";

// ---------- session helpers ----------

type Session = {
  chat_id: number;
  panel_message_id: number | null;
  state: string;
  data: Record<string, any>;
};

async function getSession(admin: ReturnType<typeof getSupabaseAdmin>, chatId: number): Promise<Session> {
  const { data } = await admin.from("qco2_tg_admin_sessions").select("*").eq("chat_id", chatId).maybeSingle();
  if (data) return data as Session;
  const fresh: Session = { chat_id: chatId, panel_message_id: null, state: "idle", data: {} };
  await admin.from("qco2_tg_admin_sessions").upsert({ ...fresh, updated_at: new Date().toISOString() });
  return fresh;
}

async function saveSession(admin: ReturnType<typeof getSupabaseAdmin>, s: Session) {
  await admin.from("qco2_tg_admin_sessions").upsert({ ...s, updated_at: new Date().toISOString() });
}

function fmtDate(iso: string | null): string {
  if (!iso) return "-";
  return new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

const BACK_BTN = { text: "🔙 Menu Utama", callback_data: "menu:main" };
const CANCEL_BTN = { text: "❌ Batal", callback_data: "cancel" };

// ---------- public "Live Status" inline buttons (attached to every outbound signal,
// auto AND manual) -- unlike the rest of this bot, these are NOT admin-gated: any
// channel subscriber can tap them and gets a private popup (answerCallbackQuery
// show_alert) computed from the live price at the exact moment of the tap, never
// a cache. Kept intentionally short (Telegram's alert popup is capped at 200 chars),
// split into 3 focused buttons instead of one wall of text. ----------

function fmtPrice(n: number, decimals: number) {
  return n.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

async function buildSigStatusText(admin: ReturnType<typeof getSupabaseAdmin>, kind: string, signalId: string): Promise<string> {
  const { data: sig } = await admin.from("qco2_signals").select("*").eq("id", signalId).maybeSingle();
  if (!sig) return "Sinyal tidak ditemukan (mungkin sudah lama/terhapus).";

  const cfg = SIGNAL_PAIRS.find((p) => p.label === sig.pair);
  const pipUnit: number = sig.pip_unit || cfg?.pipUnit || 1;
  const decimals = pipUnit < 1 ? 2 : 0;
  const dir: string = sig.direction;

  // Closed signals: no more live tracking, just report the final outcome.
  if (sig.status !== "active") {
    const outcomeLabel: Record<string, string> = {
      tp_hit: `TP TERCAPAI (${(sig.hit_level || "").toUpperCase()})`,
      sl_hit: "SL TERKENA",
      timeout: "TIMEOUT (belum kena target)",
      closed: "DITUTUP",
    };
    return `${sig.pair} ${dir} — Sinyal sudah SELESAI.
Hasil: ${outcomeLabel[sig.status] || sig.status}
Entry: ${fmtPrice(sig.entry, decimals)}`;
  }

  let livePrice: number;
  try {
    livePrice = await getLivePriceForPair(sig.pair, cfg?.dataInstId || "");
  } catch {
    return "Gagal ambil harga live saat ini, coba lagi sebentar lagi.";
  }

  const pipsRunning = Math.round(
    dir === "BUY" ? (livePrice - sig.entry) / pipUnit : (sig.entry - livePrice) / pipUnit
  );

  if (kind === "live") {
    return (
      `${sig.pair} ${dir} — LIVE
` +
      `Harga skrg: ${fmtPrice(livePrice, decimals)}
` +
      `Entry: ${fmtPrice(sig.entry, decimals)}
` +
      `Running: ${pipsRunning >= 0 ? "+" : ""}${pipsRunning} pips`
    );
  }

  if (kind === "target") {
    const tps: number[] = [sig.take_profit, sig.tp2, sig.tp3, sig.tp4].filter((v) => v !== null && v !== undefined);
    let nextIdx = -1;
    const tpLines = tps
      .map((tp, i) => {
        const tpPips = Math.round(Math.abs(tp - sig.entry) / pipUnit);
        const reached = dir === "BUY" ? livePrice >= tp : livePrice <= tp;
        if (!reached && nextIdx === -1) nextIdx = i;
        return `TP${i + 1} ${tpPips}${reached ? "✓" : ""}`;
      })
      .join(" ");
    const slPips = Math.round(Math.abs(sig.stop_loss - sig.entry) / pipUnit);
    const toNext =
      nextIdx >= 0 ? Math.round(Math.abs(tps[nextIdx] - livePrice) / pipUnit) : 0;
    const nextLine = nextIdx >= 0 ? `\nMenuju TP${nextIdx + 1}: butuh +${toNext} pips lagi` : "\nSemua TP tercapai";
    return `${sig.pair} ${dir} | Live ${fmtPrice(livePrice, decimals)}\n${tpLines}\nSL ${slPips} pips${nextLine}`;
  }

  // kind === "be"
  const BE_THRESHOLDS = [20, 50, 70];
  const level: number = sig.be_alert_level || 0;
  const nextThreshold = BE_THRESHOLDS.find((t) => t > level);
  return (
    `${sig.pair} ${dir} — Status BE
` +
    `Running: ${pipsRunning >= 0 ? "+" : ""}${pipsRunning} pips
` +
    `Level BE tercapai: ${level > 0 ? level + " pips (AKTIF)" : "belum"}
` +
    `${nextThreshold ? "Next level: " + nextThreshold + " pips" : "Sudah level maksimal"}`
  );
}

// ---------- main menu ----------

function mainMenuView(): { text: string; kb: InlineKeyboard } {
  return {
    text:
      "🎛 <b>LASTQUESTION.CO — ADMIN PANEL</b>\n━━━━━━━━━━━━━━━━\n\nSemua aksi di sini langsung sinkron ke web &amp; channel Telegram.\n\nPilih menu:",
    kb: [
      [{ text: "📊 Sinyal Manual", callback_data: "menu:signal" }],
      [{ text: "👥 Member VIP", callback_data: "menu:vip" }],
      [{ text: "🧾 Invoice Masuk", callback_data: "menu:invoice" }],
      [{ text: "📈 Statistik Global", callback_data: "menu:globalstats" }],
      [{ text: "🏆 Tambah Lot Entry", callback_data: "menu:lot" }],
      [{ text: "📢 Broadcast Pengumuman", callback_data: "menu:broadcast" }],
      [{ text: "📊 Statistik Cepat", callback_data: "menu:stats" }],
      [{ text: "❌ Tutup Panel", callback_data: "menu:close" }],
    ],
  };
}

// ---------- signal wizard views ----------

function pairStepView(): { text: string; kb: InlineKeyboard } {
  const rows: InlineKeyboard = [];
  for (let i = 0; i < SIGNAL_PAIR_OPTIONS.length; i += 2) {
    rows.push(SIGNAL_PAIR_OPTIONS.slice(i, i + 2).map((p) => ({ text: p, callback_data: `sig:pair:${p}` })));
  }
  rows.push([CANCEL_BTN]);
  return { text: "📊 <b>BUAT SINYAL MANUAL</b>\n━━━━━━━━━━━━━━━━\n\nStep 1/6 — Pilih pair:", kb: rows };
}

function directionStepView(pair: string): { text: string; kb: InlineKeyboard } {
  return {
    text: `📊 <b>BUAT SINYAL MANUAL</b>\n━━━━━━━━━━━━━━━━\n\nPair: <b>${pair}</b>\nStep 2/6 — Pilih arah:`,
    kb: [
      [
        { text: "🟢 BUY", callback_data: "sig:dir:BUY" },
        { text: "🔴 SELL", callback_data: "sig:dir:SELL" },
      ],
      [CANCEL_BTN],
    ],
  };
}

function textPromptView(header: string, stepLabel: string): { text: string; kb: InlineKeyboard } {
  return { text: `📊 <b>BUAT SINYAL MANUAL</b>\n━━━━━━━━━━━━━━━━\n\n${header}\n${stepLabel}`, kb: [[CANCEL_BTN]] };
}

function tpMenuView(header: string, tpCount: number): { text: string; kb: InlineKeyboard } {
  const kb: InlineKeyboard = [];
  if (tpCount < 4) kb.push([{ text: `➕ Tambah TP${tpCount + 1}`, callback_data: "sig:tp:add" }]);
  kb.push([{ text: "✅ Lanjut", callback_data: "sig:tp:done" }]);
  kb.push([CANCEL_BTN]);
  return {
    text: `📊 <b>BUAT SINYAL MANUAL</b>\n━━━━━━━━━━━━━━━━\n\n${header}\n\nStep 5/6 — TP sudah ${tpCount}. Tambah lagi atau lanjut?`,
    kb,
  };
}

function audienceStepView(header: string): { text: string; kb: InlineKeyboard } {
  return {
    text: `📊 <b>BUAT SINYAL MANUAL</b>\n━━━━━━━━━━━━━━━━\n\n${header}\n\nStep 6/6 — Kirim ke mana?`,
    kb: [
      [{ text: "🔒 VIP Only", callback_data: "sig:aud:vip" }],
      [{ text: "🌍 VIP + Publik", callback_data: "sig:aud:public" }],
      [CANCEL_BTN],
    ],
  };
}

function confirmStepView(d: Record<string, any>): { text: string; kb: InlineKeyboard } {
  const tps = (d.tps || []) as number[];
  const tpLines = tps.map((tp, i) => `TP${i + 1}: <b>${tp}</b>`).join("\n");
  const audienceLabel = d.audience === "public" ? "🌍 VIP + Publik" : "🔒 VIP Only";
  return {
    text:
      `📊 <b>KONFIRMASI SINYAL</b>\n━━━━━━━━━━━━━━━━\n\n` +
      `Pair    : <b>${d.pair}</b>\nArah    : <b>${d.direction}</b>\nEntry   : <b>${d.entry}</b>\nSL      : <b>${d.sl}</b>\n` +
      `${tpLines}\nTujuan  : ${audienceLabel}\n\nKirim sekarang?`,
    kb: [
      [{ text: "✅ KIRIM SEKARANG", callback_data: "sig:confirm" }],
      [CANCEL_BTN],
    ],
  };
}

function broadcastTitlePromptView(): { text: string; kb: InlineKeyboard } {
  return { text: "📢 <b>BROADCAST PENGUMUMAN</b>\n━━━━━━━━━━━━━━━━\n\nKetik JUDUL pengumuman:", kb: [[CANCEL_BTN]] };
}

function broadcastBodyPromptView(title: string): { text: string; kb: InlineKeyboard } {
  return {
    text: `📢 <b>BROADCAST PENGUMUMAN</b>\n━━━━━━━━━━━━━━━━\n\nJudul: <b>${title}</b>\n\nKetik ISI pengumuman:`,
    kb: [[CANCEL_BTN]],
  };
}

// ---------- outbound signal message (NO "manual" wording — reads like a normal signal) ----------

function fmtNum(n: number, decimals: number) {
  return n.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

function buildSignalMessage(pairKey: string, direction: string, entry: number, sl: number, tps: number[]): string {
  const cfg = SIGNAL_PAIRS.find((p) => p.key === pairKey);
  const decimals = cfg && cfg.pipUnit < 1 ? 2 : 0;
  const pipUnit = cfg?.pipUnit || 1;
  const pips = (price: number) => Math.round(Math.abs(price - entry) / pipUnit);
  const tpLines = tps.map((tp, i) => `   TP${i + 1}  ›  ${fmtNum(tp, decimals)}  (${pips(tp)} pips)`).join("\n");
  return (
    `⚜️ <b>LASTQUESTION VVIP SIGNAL</b> ⚜️\n━━━━━━━━━━━━━━━━\n\n` +
    `📊 PAIR    : ${pairKey}\n📈 SETUP   : <b>${direction}</b>\n🎯 ENTRY   : ${fmtNum(entry, decimals)}\n\n` +
    `🎯 TAKE PROFIT\n${tpLines}\n\n` +
    `🛑 STOP LOSS : ${fmtNum(sl, decimals)}  (${pips(sl)} pips)\n\n` +
    `⚠️ Gunakan money management.\nAmankan profit di TP1 / TP2, hindari overtrade.\n\n` +
    `#LASTQUESTIONVVIP\n━━━━━━━━━━━━━━━━\nlastquestion.store`
  );
}

// ---------- Member VIP views ----------

async function vipListView(admin: ReturnType<typeof getSupabaseAdmin>): Promise<{ text: string; kb: InlineKeyboard }> {
  const { data } = await admin
    .from("qco2_profiles")
    .select("id, full_name, email, expired_at")
    .eq("role", "vip_member")
    .order("expired_at", { ascending: true })
    .limit(5);

  const rows: InlineKeyboard = [];
  let text = "👥 <b>MEMBER VIP — EXPIRY TERDEKAT</b>\n━━━━━━━━━━━━━━━━\n\n";
  if (!data || data.length === 0) {
    text += "Tidak ada member VIP aktif.";
  } else {
    data.forEach((p, i) => {
      const label = p.full_name || p.email;
      text += `${i + 1}. <b>${label}</b>\n   Expired: ${fmtDate(p.expired_at)}\n\n`;
      rows.push([{ text: `+30 hari → ${label}`.slice(0, 60), callback_data: `mem:extend:${p.id}` }]);
    });
  }
  rows.push([{ text: "🔍 Cari Member Lain", callback_data: "mem:search" }]);
  rows.push([BACK_BTN]);
  return { text, kb: rows };
}

function memberSearchPromptView(): { text: string; kb: InlineKeyboard } {
  return { text: "🔍 <b>CARI MEMBER</b>\n━━━━━━━━━━━━━━━━\n\nKetik email atau nama member:", kb: [[CANCEL_BTN]] };
}

// ---------- Invoice views ----------

async function invoiceListView(admin: ReturnType<typeof getSupabaseAdmin>): Promise<{ text: string; kb: InlineKeyboard }> {
  const { data } = await admin
    .from("qco2_invoices")
    .select("id, email, tier, amount, created_at")
    .eq("status", "pending")
    .order("created_at", { ascending: true })
    .limit(5);

  const rows: InlineKeyboard = [];
  let text = "🧾 <b>INVOICE PENDING</b>\n━━━━━━━━━━━━━━━━\n\n";
  if (!data || data.length === 0) {
    text += "Tidak ada invoice pending.";
  } else {
    data.forEach((inv, i) => {
      text += `${i + 1}. <b>${inv.email}</b>\n   ${inv.tier} — Rp${Number(inv.amount).toLocaleString("id-ID")}\n\n`;
      rows.push([
        { text: `✅ Confirm #${i + 1}`, callback_data: `inv:confirm:${inv.id}` },
        { text: `❌ Reject #${i + 1}`, callback_data: `inv:reject:${inv.id}` },
      ]);
    });
  }
  rows.push([BACK_BTN]);
  return { text, kb: rows };
}

// ---------- Global stats views ----------

async function globalStatsView(admin: ReturnType<typeof getSupabaseAdmin>): Promise<{ text: string; kb: InlineKeyboard }> {
  const { data } = await admin.from("global_statistics").select("*").eq("id", 1).maybeSingle();
  const text =
    `📈 <b>STATISTIK GLOBAL</b>\n━━━━━━━━━━━━━━━━\n\n` +
    `🎯 Win Rate       : <b>${data?.win_rate ?? "-"}%</b>\n` +
    `📊 Total Trade    : <b>${data?.total_trade ?? "-"}</b>\n` +
    `💰 Profit Pips    : <b>${data?.profit_pips ?? "-"}</b>\n` +
    `🎓 Kelas Selesai  : <b>${data?.kelas_completed ?? "-"}</b>\n\n` +
    `Pilih yang mau diedit:`;
  const kb: InlineKeyboard = [
    [{ text: "✏️ Win Rate", callback_data: "gs:edit:win_rate" }],
    [{ text: "✏️ Total Trade", callback_data: "gs:edit:total_trade" }],
    [{ text: "✏️ Profit Pips", callback_data: "gs:edit:profit_pips" }],
    [{ text: "✏️ Kelas Selesai", callback_data: "gs:edit:kelas_completed" }],
    [BACK_BTN],
  ];
  return { text, kb };
}

const GS_LABELS: Record<string, string> = {
  win_rate: "Win Rate (%)",
  total_trade: "Total Trade",
  profit_pips: "Profit Pips",
  kelas_completed: "Kelas Selesai",
};

function gsEditPromptView(field: string): { text: string; kb: InlineKeyboard } {
  return {
    text: `📈 <b>EDIT STATISTIK GLOBAL</b>\n━━━━━━━━━━━━━━━━\n\nKetik nilai baru untuk <b>${GS_LABELS[field]}</b>:`,
    kb: [[CANCEL_BTN]],
  };
}

// ---------- Lot entry views ----------

function lotSearchPromptView(): { text: string; kb: InlineKeyboard } {
  return { text: "🏆 <b>TAMBAH LOT ENTRY</b>\n━━━━━━━━━━━━━━━━\n\nKetik email atau nama member:", kb: [[CANCEL_BTN]] };
}

function lotPairStepView(memberLabel: string): { text: string; kb: InlineKeyboard } {
  return {
    text: `🏆 <b>TAMBAH LOT ENTRY</b>\n━━━━━━━━━━━━━━━━\n\nMember: <b>${memberLabel}</b>\nPilih pair:`,
    kb: [
      [
        { text: "XAUUSD", callback_data: "lot:pair:XAUUSD" },
        { text: "BTCUSDT", callback_data: "lot:pair:BTCUSDT" },
      ],
      [CANCEL_BTN],
    ],
  };
}

function lotSizePromptView(header: string): { text: string; kb: InlineKeyboard } {
  return { text: `🏆 <b>TAMBAH LOT ENTRY</b>\n━━━━━━━━━━━━━━━━\n\n${header}\n\nKetik jumlah LOT (0.01 - 1.00):`, kb: [[CANCEL_BTN]] };
}

function lotPricePromptView(header: string): { text: string; kb: InlineKeyboard } {
  return { text: `🏆 <b>TAMBAH LOT ENTRY</b>\n━━━━━━━━━━━━━━━━\n\n${header}\n\nKetik HARGA saat entry:`, kb: [[CANCEL_BTN]] };
}

function lotConfirmView(d: Record<string, any>): { text: string; kb: InlineKeyboard } {
  return {
    text:
      `🏆 <b>KONFIRMASI LOT ENTRY</b>\n━━━━━━━━━━━━━━━━\n\n` +
      `Member : <b>${d.memberLabel}</b>\nPair   : <b>${d.pair}</b>\nLot    : <b>${d.lot}</b>\nHarga  : <b>${d.price}</b>\n\nSimpan sekarang?`,
    kb: [
      [{ text: "✅ SIMPAN", callback_data: "lot:confirm" }],
      [CANCEL_BTN],
    ],
  };
}

// ---------- webhook handler ----------

export async function POST(req: NextRequest) {
  let update: any;
  try {
    update = await req.json();
  } catch {
    return NextResponse.json({ ok: true });
  }

  const admin = getSupabaseAdmin();

  // ================= callback query (inline button press) =================
  if (update.callback_query) {
    const cq = update.callback_query;
    const fromId = cq.from?.id;
    const chatId = cq.message?.chat?.id;
    const messageId = cq.message?.message_id;
    const data: string = cq.data || "";

    if (fromId !== TELEGRAM_ADMIN_ID) {
      await answerCallbackQuery(cq.id, "Khusus admin.");
      return NextResponse.json({ ok: true });
    }

    // Admin-only manual signal-alert buttons (owner 2026-07-20: "inline button nya
    // itu khusus admin, jadi kalo gua pencet langsung ngirim alert ke channel").
    // TP1-4 / SL fire that exact alert to the channel AND update the signal's real
    // state via the SAME lib/signalAlerts.ts functions the automatic cron uses --
    // so manual and automatic can never conflict or double-fire. BE advances one
    // threshold step per press. LIVE stays a read-only price/pips check.
    if (data.startsWith("sigact:")) {
      const [, action, signalId] = data.split(":");

      if (action === "live") {
        const text = await buildSigStatusText(admin, "live", signalId);
        await answerCallbackQuery(cq.id, text.slice(0, 200), true);
        return NextResponse.json({ ok: true });
      }

      const { data: sig } = await admin.from("qco2_signals").select("*").eq("id", signalId).maybeSingle();
      if (!sig) {
        await answerCallbackQuery(cq.id, "Sinyal tidak ditemukan.", true);
        return NextResponse.json({ ok: true });
      }
      const cfg = SIGNAL_PAIRS.find((p) => p.label === sig.pair);
      if (!cfg) {
        await answerCallbackQuery(cq.id, "Konfigurasi pair tidak ditemukan.", true);
        return NextResponse.json({ ok: true });
      }
      const decimals = decimalsFor(cfg);

      if (action.startsWith("tp")) {
        const level = parseInt(action.replace("tp", ""), 10);
        const res = await advanceTp(admin, cfg, decimals, sig, level);
        const msg =
          res.status === "fired"
            ? `TP${level} alert terkirim ke channel.${res.closed ? " Sinyal ditutup (TP terakhir)." : ""}`
            : res.status === "already"
            ? `TP${level} sudah pernah terkirim sebelumnya.`
            : res.status === "invalid"
            ? `TP${level} tidak ada di sinyal ini.`
            : "Sinyal ini sudah closed (SL/TP/timeout lain).";
        await answerCallbackQuery(cq.id, msg, true);
        return NextResponse.json({ ok: true });
      }

      if (action === "sl") {
        const res = await closeViaSl(admin, cfg, decimals, sig);
        const msg = res.status === "fired" ? "SL alert terkirim ke channel. Sinyal ditutup." : "Sinyal ini sudah closed sebelumnya.";
        await answerCallbackQuery(cq.id, msg, true);
        return NextResponse.json({ ok: true });
      }

      if (action === "be") {
        const res = await advanceBe(admin, cfg, decimals, sig);
        const msg =
          res.status === "fired"
            ? `BE alert (level ${res.threshold}) terkirim ke channel.`
            : res.status === "already"
            ? "Semua level BE sudah terkirim."
            : "Sinyal ini sudah closed sebelumnya.";
        await answerCallbackQuery(cq.id, msg, true);
        return NextResponse.json({ ok: true });
      }

      await answerCallbackQuery(cq.id, "Aksi tidak dikenali.");
      return NextResponse.json({ ok: true });
    }

    await answerCallbackQuery(cq.id);
    const session = await getSession(admin, chatId);
    session.panel_message_id = messageId;

    if (data === "menu:main" || data === "cancel") {
      session.state = "idle";
      session.data = {};
      const v = mainMenuView();
      const prefix = data === "cancel" ? "❌ Dibatalkan.\n\n" : "";
      await editMessageText(chatId, messageId, prefix + v.text, v.kb);
    } else if (data === "menu:close") {
      await deleteMessage(chatId, messageId);
      session.state = "idle";
      session.data = {};
      session.panel_message_id = null;
    } else if (data === "menu:signal") {
      session.state = "signal_pair";
      session.data = {};
      const v = pairStepView();
      await editMessageText(chatId, messageId, v.text, v.kb);
    } else if (data === "menu:broadcast") {
      session.state = "broadcast_title";
      session.data = {};
      const v = broadcastTitlePromptView();
      await editMessageText(chatId, messageId, v.text, v.kb);
    } else if (data === "menu:vip") {
      session.state = "idle";
      session.data = {};
      const v = await vipListView(admin);
      await editMessageText(chatId, messageId, v.text, v.kb);
    } else if (data === "mem:search") {
      session.state = "vip_search";
      const v = memberSearchPromptView();
      await editMessageText(chatId, messageId, v.text, v.kb);
    } else if (data.startsWith("mem:extend:")) {
      const id = data.split(":")[2];
      const { data: prof } = await admin.from("qco2_profiles").select("expired_at").eq("id", id).maybeSingle();
      const base = prof?.expired_at && new Date(prof.expired_at).getTime() > Date.now() ? new Date(prof.expired_at).getTime() : Date.now();
      const newExpiry = new Date(base + 30 * 24 * 60 * 60 * 1000).toISOString();
      await admin.from("qco2_profiles").update({ role: "vip_member", expired_at: newExpiry, updated_at: new Date().toISOString() }).eq("id", id);
      const v = await vipListView(admin);
      await editMessageText(chatId, messageId, `✅ Diperpanjang 30 hari.\n\n${v.text}`, v.kb);
    } else if (data === "menu:invoice") {
      session.state = "idle";
      session.data = {};
      const v = await invoiceListView(admin);
      await editMessageText(chatId, messageId, v.text, v.kb);
    } else if (data.startsWith("inv:confirm:") || data.startsWith("inv:reject:")) {
      const id = data.split(":")[2];
      const isConfirm = data.startsWith("inv:confirm:");
      const status = isConfirm ? "confirmed" : "rejected";
      const { data: invoice } = await admin
        .from("qco2_invoices")
        .update({ status, confirmed_at: isConfirm ? new Date().toISOString() : null })
        .eq("id", id)
        .select()
        .single();

      if (isConfirm && invoice) {
        const expiredAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
        const { data: existing } = await admin.from("qco2_profiles").select("id").eq("email", invoice.email).maybeSingle();
        if (existing) {
          await admin
            .from("qco2_profiles")
            .update({ role: "vip_member", tier: invoice.tier, expired_at: expiredAt, updated_at: new Date().toISOString() })
            .eq("id", existing.id);
        } else {
          await admin.from("qco2_profiles").insert({ email: invoice.email, role: "vip_member", tier: invoice.tier, expired_at: expiredAt });
        }
      }
      const v = await invoiceListView(admin);
      const prefix = isConfirm ? "✅ Invoice dikonfirmasi, member jadi VIP 30 hari.\n\n" : "❌ Invoice ditolak.\n\n";
      await editMessageText(chatId, messageId, prefix + v.text, v.kb);
    } else if (data === "menu:globalstats") {
      session.state = "idle";
      session.data = {};
      const v = await globalStatsView(admin);
      await editMessageText(chatId, messageId, v.text, v.kb);
    } else if (data.startsWith("gs:edit:")) {
      const field = data.split(":")[2];
      session.state = "gs_awaiting_value";
      session.data = { field };
      const v = gsEditPromptView(field);
      await editMessageText(chatId, messageId, v.text, v.kb);
    } else if (data === "menu:lot") {
      session.state = "lot_search";
      session.data = {};
      const v = lotSearchPromptView();
      await editMessageText(chatId, messageId, v.text, v.kb);
    } else if (data.startsWith("lot:pick:")) {
      const id = data.split(":")[2];
      const { data: prof } = await admin.from("qco2_profiles").select("id, full_name, email").eq("id", id).maybeSingle();
      if (!prof) {
        await editMessageText(chatId, messageId, "❌ Member tidak ditemukan.", [[BACK_BTN]]);
      } else {
        session.state = "lot_pair";
        session.data = { profile_id: prof.id, memberLabel: prof.full_name || prof.email };
        const v = lotPairStepView(session.data.memberLabel);
        await editMessageText(chatId, messageId, v.text, v.kb);
      }
    } else if (data.startsWith("lot:pair:")) {
      const pair = data.split(":")[2];
      session.data = { ...session.data, pair };
      session.state = "lot_size_input";
      const v = lotSizePromptView(`Member: <b>${session.data.memberLabel}</b> | Pair: <b>${pair}</b>`);
      await editMessageText(chatId, messageId, v.text, v.kb);
    } else if (data === "lot:confirm") {
      const d = session.data;
      const { data: profile } = await admin.from("qco2_profiles").select("id, total_lot").eq("id", d.profile_id).maybeSingle();
      if (!profile) {
        await editMessageText(chatId, messageId, "❌ Member tidak ditemukan.", [[BACK_BTN]]);
      } else {
        const direction = Math.random() < 0.5 ? "BUY" : "SELL";
        await admin.from("qco2_lot_entries").insert({ profile_id: d.profile_id, pair: d.pair, lot_size: d.lot, price: d.price, is_auto: false, direction });
        const nextLot = Math.round((Number(profile.total_lot ?? 0) + d.lot) * 100) / 100;
        await admin.from("qco2_profiles").update({ total_lot: nextLot, updated_at: new Date().toISOString() }).eq("id", d.profile_id);
        await editMessageText(chatId, messageId, `✅ Lot entry tersimpan!\n\nTotal lot member sekarang: <b>${nextLot}</b>`, [[BACK_BTN]]);
      }
      session.state = "idle";
      session.data = {};
    } else if (data === "menu:stats") {
      const { count: activeCount } = await admin.from("qco2_signals").select("*", { count: "exact", head: true }).eq("status", "active");
      const todayStart = new Date();
      todayStart.setUTCHours(0, 0, 0, 0);
      const { data: closedToday } = await admin.from("qco2_signals").select("status").gte("closed_at", todayStart.toISOString());
      const tpCount = (closedToday || []).filter((r: any) => r.status === "tp_hit").length;
      const slCount = (closedToday || []).filter((r: any) => r.status === "sl_hit").length;
      const total = tpCount + slCount;
      const winRate = total > 0 ? Math.round((tpCount / total) * 100) : 0;
      const text =
        `📈 <b>STATISTIK CEPAT</b>\n━━━━━━━━━━━━━━━━\n\n🟢 Sinyal Aktif   : <b>${activeCount ?? 0}</b>\n` +
        `✅ TP Hari Ini    : <b>${tpCount}</b>\n🔴 SL Hari Ini    : <b>${slCount}</b>\n🎯 Win Rate Hari Ini : <b>${winRate}%</b>`;
      await editMessageText(chatId, messageId, text, [[BACK_BTN]]);
    } else if (data.startsWith("sig:pair:")) {
      const pair = data.split(":")[2];
      session.state = "signal_direction";
      session.data = { pair };
      const v = directionStepView(pair);
      await editMessageText(chatId, messageId, v.text, v.kb);
    } else if (data.startsWith("sig:dir:")) {
      const direction = data.split(":")[2];
      session.state = "signal_entry";
      session.data = { ...session.data, direction };
      const v = textPromptView(`Pair: <b>${session.data.pair}</b> | Arah: <b>${direction}</b>`, "Step 3/6 — Ketik harga ENTRY (contoh: 3950.5):");
      await editMessageText(chatId, messageId, v.text, v.kb);
    } else if (data === "sig:tp:add") {
      session.state = "signal_tp_input";
      const tps = (session.data.tps || []) as number[];
      const v = textPromptView(
        `Pair: <b>${session.data.pair}</b> | Entry: <b>${session.data.entry}</b> | SL: <b>${session.data.sl}</b>`,
        `Step 5/6 — Ketik harga TP${tps.length + 1}:`
      );
      await editMessageText(chatId, messageId, v.text, v.kb);
    } else if (data === "sig:tp:done") {
      const tps = (session.data.tps || []) as number[];
      if (tps.length === 0) {
        await sendMessage(chatId, "Minimal harus ada 1 TP.");
      } else {
        session.state = "signal_audience";
        const header = `Pair: <b>${session.data.pair}</b> | Entry: <b>${session.data.entry}</b> | SL: <b>${session.data.sl}</b>\nTP: ${tps.join(", ")}`;
        const v = audienceStepView(header);
        await editMessageText(chatId, messageId, v.text, v.kb);
      }
    } else if (data.startsWith("sig:aud:")) {
      const audience = data.split(":")[2];
      session.data = { ...session.data, audience };
      session.state = "signal_confirm";
      const v = confirmStepView(session.data);
      await editMessageText(chatId, messageId, v.text, v.kb);
    } else if (data === "sig:confirm") {
      const d = session.data;
      const tps = (d.tps || []) as number[];
      const insertPayload: Record<string, unknown> = {
        pair: d.pair,
        direction: d.direction,
        entry: d.entry,
        stop_loss: d.sl,
        take_profit: tps[0],
        tp2: tps[1] ?? null,
        tp3: tps[2] ?? null,
        tp4: tps[3] ?? null,
        status: "active",
        source: "manual",
        audience: d.audience,
      };
      const cfg = SIGNAL_PAIRS.find((p) => p.key === d.pair);
      if (cfg) insertPayload.pip_unit = cfg.pipUnit;

      const { data: createdSig, error } = await admin.from("qco2_signals").insert(insertPayload).select().single();
      if (error) {
        await editMessageText(chatId, messageId, `❌ Gagal simpan sinyal: ${error.message}`, [[BACK_BTN]]);
      } else {
        const msg = buildSignalMessage(d.pair, d.direction, d.entry, d.sl, tps);
        const kb = signalStatusKeyboard(createdSig.id);
        await sendToChannel(vipChannelId(), msg, kb);
        if (d.audience === "public") await sendToChannel(publicChannelId(), msg, kb);
        await editMessageText(chatId, messageId, `✅ <b>Sinyal berhasil dikirim!</b>\n\nSudah tayang di web dan channel Telegram.`, [[BACK_BTN]]);
      }
      session.state = "idle";
      session.data = {};
    }

    await saveSession(admin, session);
    return NextResponse.json({ ok: true });
  }

  // ================= plain message =================
  if (update.message) {
    const msg = update.message;
    const fromId = msg.from?.id;
    const chatId = msg.chat?.id;
    const messageId = msg.message_id;
    const text: string = (msg.text || "").trim();

    if (msg.chat?.type !== "private") return NextResponse.json({ ok: true });

    if (fromId !== TELEGRAM_ADMIN_ID) {
      await sendMessage(chatId, "Bot ini khusus admin LASTQUESTION.CO.");
      return NextResponse.json({ ok: true });
    }

    if (text === "/start" || text === "/admin") {
      const session = await getSession(admin, chatId);
      if (session.panel_message_id) await deleteMessage(chatId, session.panel_message_id).catch(() => {});
      const v = mainMenuView();
      const sent = await sendMessage(chatId, v.text, v.kb);
      session.panel_message_id = sent?.result?.message_id ?? null;
      session.state = "idle";
      session.data = {};
      await saveSession(admin, session);
      return NextResponse.json({ ok: true });
    }

    const session = await getSession(admin, chatId);
    const panelId = session.panel_message_id;

    const numericSteps = ["signal_entry", "signal_sl", "signal_tp_input", "gs_awaiting_value", "lot_size_input", "lot_price_input"];
    const textSteps = ["broadcast_title", "broadcast_body", "vip_search", "lot_search"];

    if (!numericSteps.includes(session.state) && !textSteps.includes(session.state)) {
      await deleteMessage(chatId, messageId).catch(() => {});
      return NextResponse.json({ ok: true });
    }

    await deleteMessage(chatId, messageId).catch(() => {});
    if (!panelId) return NextResponse.json({ ok: true });

    if (numericSteps.includes(session.state)) {
      const num = Number(text.replace(",", "."));
      if (Number.isNaN(num)) {
        await sendMessage(chatId, "⚠️ Harus angka. Coba lagi.");
        return NextResponse.json({ ok: true });
      }

      if (session.state === "signal_entry") {
        session.data = { ...session.data, entry: num };
        session.state = "signal_sl";
        const v = textPromptView(`Pair: <b>${session.data.pair}</b> | Arah: <b>${session.data.direction}</b> | Entry: <b>${num}</b>`, "Step 4/6 — Ketik harga STOP LOSS:");
        await editMessageText(chatId, panelId, v.text, v.kb);
      } else if (session.state === "signal_sl") {
        session.data = { ...session.data, sl: num };
        session.state = "signal_tp_input";
        const v = textPromptView(`Pair: <b>${session.data.pair}</b> | Entry: <b>${session.data.entry}</b> | SL: <b>${num}</b>`, "Step 5/6 — Ketik harga TP1:");
        await editMessageText(chatId, panelId, v.text, v.kb);
      } else if (session.state === "signal_tp_input") {
        const tps = [...(session.data.tps || []), num];
        session.data = { ...session.data, tps };
        session.state = "signal_tp_menu";
        const header = `Pair: <b>${session.data.pair}</b> | Entry: <b>${session.data.entry}</b> | SL: <b>${session.data.sl}</b>\nTP: ${tps.join(", ")}`;
        const v = tpMenuView(header, tps.length);
        await editMessageText(chatId, panelId, v.text, v.kb);
      } else if (session.state === "gs_awaiting_value") {
        const field = session.data.field as string;
        await admin.from("global_statistics").update({ [field]: num, updated_at: new Date().toISOString() }).eq("id", 1);
        const v = await globalStatsView(admin);
        await editMessageText(chatId, panelId, `✅ ${GS_LABELS[field]} diupdate ke ${num}.\n\n${v.text}`, v.kb);
        session.state = "idle";
        session.data = {};
      } else if (session.state === "lot_size_input") {
        if (num < 0.01 || num > 1) {
          await sendMessage(chatId, "⚠️ Lot harus antara 0.01 - 1.00.");
          return NextResponse.json({ ok: true });
        }
        session.data = { ...session.data, lot: num };
        session.state = "lot_price_input";
        const v = lotPricePromptView(`Member: <b>${session.data.memberLabel}</b> | Pair: <b>${session.data.pair}</b> | Lot: <b>${num}</b>`);
        await editMessageText(chatId, panelId, v.text, v.kb);
      } else if (session.state === "lot_price_input") {
        session.data = { ...session.data, price: num };
        session.state = "lot_confirm";
        const v = lotConfirmView(session.data);
        await editMessageText(chatId, panelId, v.text, v.kb);
      }
    } else if (textSteps.includes(session.state)) {
      if (session.state === "broadcast_title") {
        session.data = { title: text };
        session.state = "broadcast_body";
        const v = broadcastBodyPromptView(text);
        await editMessageText(chatId, panelId, v.text, v.kb);
      } else if (session.state === "broadcast_body") {
        const title = session.data.title || "Pengumuman";
        const { error } = await admin.from("qco2_announcements").insert({ title, body: text, pinned: false });
        if (error) {
          await editMessageText(chatId, panelId, `❌ Gagal simpan pengumuman: ${error.message}`, [[BACK_BTN]]);
        } else {
          const broadcastMsg = `📢 <b>PENGUMUMAN</b>\n━━━━━━━━━━━━━━━━\n\n<b>${title}</b>\n\n${text}\n\nlastquestion.store`;
          await sendToChannel(vipChannelId(), broadcastMsg);
          await sendToChannel(publicChannelId(), broadcastMsg);
          await editMessageText(chatId, panelId, `✅ <b>Pengumuman terkirim!</b>\n\nTayang di web dan kedua channel Telegram.`, [[BACK_BTN]]);
        }
        session.state = "idle";
        session.data = {};
      } else if (session.state === "vip_search") {
        const { data: matches } = await admin
          .from("qco2_profiles")
          .select("id, full_name, email, expired_at")
          .or(`email.ilike.%${text}%,full_name.ilike.%${text}%`)
          .limit(5);
        const rows: InlineKeyboard = [];
        let out = `🔍 <b>HASIL PENCARIAN</b>\n━━━━━━━━━━━━━━━━\n\n`;
        if (!matches || matches.length === 0) {
          out += "Tidak ditemukan.";
        } else {
          matches.forEach((p: any, i: number) => {
            const label = p.full_name || p.email;
            out += `${i + 1}. <b>${label}</b> — Exp: ${fmtDate(p.expired_at)}\n`;
            rows.push([{ text: `+30 hari → ${label}`.slice(0, 60), callback_data: `mem:extend:${p.id}` }]);
          });
        }
        rows.push([BACK_BTN]);
        await editMessageText(chatId, panelId, out, rows);
        session.state = "idle";
        session.data = {};
      } else if (session.state === "lot_search") {
        const { data: matches } = await admin
          .from("qco2_profiles")
          .select("id, full_name, email")
          .or(`email.ilike.%${text}%,full_name.ilike.%${text}%`)
          .limit(5);
        const rows: InlineKeyboard = [];
        let out = `🏆 <b>PILIH MEMBER</b>\n━━━━━━━━━━━━━━━━\n\n`;
        if (!matches || matches.length === 0) {
          out += "Tidak ditemukan.";
        } else {
          matches.forEach((p: any) => {
            const label = p.full_name || p.email;
            rows.push([{ text: label.slice(0, 60), callback_data: `lot:pick:${p.id}` }]);
          });
        }
        rows.push([CANCEL_BTN]);
        await editMessageText(chatId, panelId, out, rows);
        // stay in a neutral state until they pick a button
        session.state = "idle";
      }
    }

    await saveSession(admin, session);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ ok: true });
}

export async function GET() {
  return NextResponse.json({ ok: true, service: "telegram-webhook" });
}
