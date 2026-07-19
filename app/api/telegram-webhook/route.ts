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
import { TELEGRAM_ADMIN_ID, vipChannelId, publicChannelId, SIGNAL_PAIR_OPTIONS } from "@/lib/telegramBotConfig";
import { SIGNAL_PAIRS } from "@/lib/signalPairs";

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
  await admin
    .from("qco2_tg_admin_sessions")
    .upsert({ ...s, updated_at: new Date().toISOString() });
}

// ---------- panel renderers ----------

function mainMenuView(): { text: string; kb: InlineKeyboard } {
  return {
    text:
      "🎛 <b>LASTQUESTION.CO — ADMIN PANEL</b>\n━━━━━━━━━━━━━━━━\n\nSemua aksi di sini langsung sinkron ke web &amp; channel Telegram.\n\nPilih menu:",
    kb: [
      [{ text: "📊 Buat Sinyal Manual", callback_data: "menu:signal" }],
      [{ text: "📢 Broadcast Pengumuman", callback_data: "menu:broadcast" }],
      [{ text: "📈 Statistik Cepat", callback_data: "menu:stats" }],
      [{ text: "❌ Tutup Panel", callback_data: "menu:close" }],
    ],
  };
}

function pairStepView(): { text: string; kb: InlineKeyboard } {
  const rows: InlineKeyboard = [];
  for (let i = 0; i < SIGNAL_PAIR_OPTIONS.length; i += 2) {
    rows.push(
      SIGNAL_PAIR_OPTIONS.slice(i, i + 2).map((p) => ({ text: p, callback_data: `sig:pair:${p}` }))
    );
  }
  rows.push([{ text: "❌ Batal", callback_data: "sig:cancel" }]);
  return {
    text: "📊 <b>BUAT SINYAL MANUAL</b>\n━━━━━━━━━━━━━━━━\n\nStep 1/6 — Pilih pair:",
    kb: rows,
  };
}

function directionStepView(pair: string): { text: string; kb: InlineKeyboard } {
  return {
    text: `📊 <b>BUAT SINYAL MANUAL</b>\n━━━━━━━━━━━━━━━━\n\nPair: <b>${pair}</b>\nStep 2/6 — Pilih arah:`,
    kb: [
      [
        { text: "🟢 BUY", callback_data: "sig:dir:BUY" },
        { text: "🔴 SELL", callback_data: "sig:dir:SELL" },
      ],
      [{ text: "❌ Batal", callback_data: "sig:cancel" }],
    ],
  };
}

function textPromptView(header: string, stepLabel: string): { text: string; kb: InlineKeyboard } {
  return {
    text: `📊 <b>BUAT SINYAL MANUAL</b>\n━━━━━━━━━━━━━━━━\n\n${header}\n${stepLabel}`,
    kb: [[{ text: "❌ Batal", callback_data: "sig:cancel" }]],
  };
}

function tpMenuView(header: string, tpCount: number): { text: string; kb: InlineKeyboard } {
  const kb: InlineKeyboard = [];
  if (tpCount < 4) {
    kb.push([{ text: `➕ Tambah TP${tpCount + 1}`, callback_data: "sig:tp:add" }]);
  }
  kb.push([{ text: "✅ Lanjut", callback_data: "sig:tp:done" }]);
  kb.push([{ text: "❌ Batal", callback_data: "sig:cancel" }]);
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
      [{ text: "❌ Batal", callback_data: "sig:cancel" }],
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
      `Pair    : <b>${d.pair}</b>\n` +
      `Arah    : <b>${d.direction}</b>\n` +
      `Entry   : <b>${d.entry}</b>\n` +
      `SL      : <b>${d.sl}</b>\n` +
      `${tpLines}\n` +
      `Tujuan  : ${audienceLabel}\n\n` +
      `Kirim sekarang?`,
    kb: [
      [{ text: "✅ KIRIM SEKARANG", callback_data: "sig:confirm" }],
      [{ text: "❌ Batalkan", callback_data: "sig:cancel" }],
    ],
  };
}

function broadcastTitlePromptView(): { text: string; kb: InlineKeyboard } {
  return {
    text: "📢 <b>BROADCAST PENGUMUMAN</b>\n━━━━━━━━━━━━━━━━\n\nKetik JUDUL pengumuman:",
    kb: [[{ text: "❌ Batal", callback_data: "sig:cancel" }]],
  };
}

function broadcastBodyPromptView(title: string): { text: string; kb: InlineKeyboard } {
  return {
    text: `📢 <b>BROADCAST PENGUMUMAN</b>\n━━━━━━━━━━━━━━━━\n\nJudul: <b>${title}</b>\n\nKetik ISI pengumuman:`,
    kb: [[{ text: "❌ Batal", callback_data: "sig:cancel" }]],
  };
}

// ---------- signal message formatting ----------

function fmtNum(n: number, decimals: number) {
  return n.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

function buildManualSignalMessage(
  pairKey: string,
  direction: string,
  entry: number,
  sl: number,
  tps: number[]
): string {
  const cfg = SIGNAL_PAIRS.find((p) => p.key === pairKey);
  const decimals = cfg && cfg.pipUnit < 1 ? 2 : 0;
  const suffix = cfg?.pipLabelSuffix || "";
  const tpLines = tps.map((tp, i) => `TP${i + 1} → ${fmtNum(tp, decimals)}`).join("\n");
  return (
    `<b>LASTQUESTION.CO — SINYAL MANUAL</b>\n\n` +
    `📊 PAIR   : ${pairKey}\n` +
    `📈 SETUP  : ${direction}\n` +
    `🎯 ENTRY  : ${fmtNum(entry, decimals)}\n\n` +
    `🎯 TAKE PROFIT\n${tpLines}\n\n` +
    `🔴 STOP LOSS : ${fmtNum(sl, decimals)}\n\n` +
    `Sumber: Analisa Manual Tim LASTQUESTION.CO\n\n` +
    `⚠️ Gunakan money management. Amankan profit bertahap.\n\n` +
    `#SINYALMANUAL #${pairKey}\n\nlastquestion.store`
  );
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

  // ----- callback query (inline button press) -----
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

    await answerCallbackQuery(cq.id);
    const session = await getSession(admin, chatId);
    session.panel_message_id = messageId;

    if (data === "menu:main") {
      session.state = "idle";
      session.data = {};
      const v = mainMenuView();
      await editMessageText(chatId, messageId, v.text, v.kb);
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
    } else if (data === "menu:stats") {
      const { count: activeCount } = await admin
        .from("qco2_signals")
        .select("*", { count: "exact", head: true })
        .eq("status", "active");
      const todayStart = new Date();
      todayStart.setUTCHours(0, 0, 0, 0);
      const { data: closedToday } = await admin
        .from("qco2_signals")
        .select("status")
        .gte("closed_at", todayStart.toISOString());
      const tpCount = (closedToday || []).filter((r: any) => r.status === "tp_hit").length;
      const slCount = (closedToday || []).filter((r: any) => r.status === "sl_hit").length;
      const total = tpCount + slCount;
      const winRate = total > 0 ? Math.round((tpCount / total) * 100) : 0;
      const text =
        `📈 <b>STATISTIK CEPAT</b>\n━━━━━━━━━━━━━━━━\n\n` +
        `🟢 Sinyal Aktif   : <b>${activeCount ?? 0}</b>\n` +
        `✅ TP Hari Ini    : <b>${tpCount}</b>\n` +
        `🔴 SL Hari Ini    : <b>${slCount}</b>\n` +
        `🎯 Win Rate Hari Ini : <b>${winRate}%</b>`;
      await editMessageText(chatId, messageId, text, [[{ text: "🔙 Menu Utama", callback_data: "menu:main" }]]);
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

      const { error } = await admin.from("qco2_signals").insert(insertPayload);
      if (error) {
        await editMessageText(chatId, messageId, `❌ Gagal simpan sinyal: ${error.message}`, [
          [{ text: "🔙 Menu Utama", callback_data: "menu:main" }],
        ]);
      } else {
        const msg = buildManualSignalMessage(d.pair, d.direction, d.entry, d.sl, tps);
        await sendToChannel(vipChannelId(), msg);
        if (d.audience === "public") {
          await sendToChannel(publicChannelId(), msg);
        }
        await editMessageText(
          chatId,
          messageId,
          `✅ <b>Sinyal berhasil dikirim!</b>\n\nSudah tayang di web dan channel Telegram.`,
          [[{ text: "🔙 Menu Utama", callback_data: "menu:main" }]]
        );
      }
      session.state = "idle";
      session.data = {};
    } else if (data === "sig:cancel") {
      session.state = "idle";
      session.data = {};
      const v = mainMenuView();
      await editMessageText(chatId, messageId, `❌ Dibatalkan.\n\n${v.text}`, v.kb);
    }

    await saveSession(admin, session);
    return NextResponse.json({ ok: true });
  }

  // ----- plain message -----
  if (update.message) {
    const msg = update.message;
    const fromId = msg.from?.id;
    const chatId = msg.chat?.id;
    const messageId = msg.message_id;
    const text: string = (msg.text || "").trim();

    if (msg.chat?.type !== "private") {
      // Ignore group/channel posts entirely — this bot's admin panel is DM-only.
      return NextResponse.json({ ok: true });
    }

    if (fromId !== TELEGRAM_ADMIN_ID) {
      await sendMessage(chatId, "Bot ini khusus admin LASTQUESTION.CO.");
      return NextResponse.json({ ok: true });
    }

    if (text === "/start" || text === "/admin") {
      const session = await getSession(admin, chatId);
      if (session.panel_message_id) {
        await deleteMessage(chatId, session.panel_message_id).catch(() => {});
      }
      const v = mainMenuView();
      const sent = await sendMessage(chatId, v.text, v.kb);
      session.panel_message_id = sent?.result?.message_id ?? null;
      session.state = "idle";
      session.data = {};
      await saveSession(admin, session);
      return NextResponse.json({ ok: true });
    }

    // Text reply for an active wizard step — process then delete the admin's message to keep chat clean.
    const session = await getSession(admin, chatId);
    const panelId = session.panel_message_id;

    const isNumericStep = ["signal_entry", "signal_sl", "signal_tp_input"].includes(session.state);
    const isTextStep = ["broadcast_title", "broadcast_body"].includes(session.state);

    if (!isNumericStep && !isTextStep) {
      // No active step expecting text — just clean up stray messages.
      await deleteMessage(chatId, messageId).catch(() => {});
      return NextResponse.json({ ok: true });
    }

    await deleteMessage(chatId, messageId).catch(() => {});
    if (!panelId) return NextResponse.json({ ok: true });

    if (isNumericStep) {
      const num = Number(text.replace(",", "."));
      if (Number.isNaN(num)) {
        await sendMessage(chatId, "⚠️ Harus angka. Coba lagi.");
        return NextResponse.json({ ok: true });
      }
      if (session.state === "signal_entry") {
        session.data = { ...session.data, entry: num };
        session.state = "signal_sl";
        const v = textPromptView(
          `Pair: <b>${session.data.pair}</b> | Arah: <b>${session.data.direction}</b> | Entry: <b>${num}</b>`,
          "Step 4/6 — Ketik harga STOP LOSS:"
        );
        await editMessageText(chatId, panelId, v.text, v.kb);
      } else if (session.state === "signal_sl") {
        session.data = { ...session.data, sl: num };
        session.state = "signal_tp_input";
        const v = textPromptView(
          `Pair: <b>${session.data.pair}</b> | Entry: <b>${session.data.entry}</b> | SL: <b>${num}</b>`,
          "Step 5/6 — Ketik harga TP1:"
        );
        await editMessageText(chatId, panelId, v.text, v.kb);
      } else if (session.state === "signal_tp_input") {
        const tps = [...(session.data.tps || []), num];
        session.data = { ...session.data, tps };
        session.state = "signal_tp_menu";
        const header = `Pair: <b>${session.data.pair}</b> | Entry: <b>${session.data.entry}</b> | SL: <b>${session.data.sl}</b>\nTP: ${tps.join(", ")}`;
        const v = tpMenuView(header, tps.length);
        await editMessageText(chatId, panelId, v.text, v.kb);
      }
    } else if (isTextStep) {
      if (session.state === "broadcast_title") {
        session.data = { title: text };
        session.state = "broadcast_body";
        const v = broadcastBodyPromptView(text);
        await editMessageText(chatId, panelId, v.text, v.kb);
      } else if (session.state === "broadcast_body") {
        const title = session.data.title || "Pengumuman";
        const { error } = await admin.from("qco2_announcements").insert({ title, body: text, pinned: false });
        if (error) {
          await editMessageText(chatId, panelId, `❌ Gagal simpan pengumuman: ${error.message}`, [
            [{ text: "🔙 Menu Utama", callback_data: "menu:main" }],
          ]);
        } else {
          const broadcastMsg = `📢 <b>PENGUMUMAN</b>\n━━━━━━━━━━━━━━━━\n\n<b>${title}</b>\n\n${text}\n\nlastquestion.store`;
          await sendToChannel(vipChannelId(), broadcastMsg);
          await sendToChannel(publicChannelId(), broadcastMsg);
          await editMessageText(chatId, panelId, `✅ <b>Pengumuman terkirim!</b>\n\nTayang di web dan kedua channel Telegram.`, [
            [{ text: "🔙 Menu Utama", callback_data: "menu:main" }],
          ]);
        }
        session.state = "idle";
        session.data = {};
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
