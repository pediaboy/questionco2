import { NextRequest, NextResponse } from "next/server";
import { sendToChannel } from "@/lib/telegramApi";
import { vipChannelId, publicChannelId } from "@/lib/telegramBotConfig";

export const dynamic = "force-dynamic";

const CRON_SECRET = "7b8725bd97d8ee2a3c4c9f27fd320bbed065ad05efb1d66d";

function morningMessage(): string {
  const wib = new Date(Date.now() + 7 * 60 * 60 * 1000);
  const dateLabel = wib.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  return (
    `☀️ <b>SELAMAT PAGI, TRADERS!</b>\n━━━━━━━━━━━━━━━━\n\n` +
    `📅 ${dateLabel}\n\n` +
    `Market baru saja bangun, dan hari ini penuh peluang baru buat yang siap eksekusi dengan rencana — bukan emosi.\n\n` +
    `🎯 Cek sinyal aktif di dashboard\n` +
    `📊 Review journal kemarin sebelum entry baru\n` +
    `🧠 Disiplin di plan, bukan feeling\n\n` +
    `Sistem Auto Signal LASTQUESTION.CO sudah standby memantau market dari sekarang. Semoga cuan hari ini konsisten dan terukur.\n\n` +
    `lastquestion.store`
  );
}

function nightMessage(): string {
  return (
    `🌙 <b>SELAMAT MALAM, TRADERS!</b>\n━━━━━━━━━━━━━━━━\n\n` +
    `Satu hari trading lagi selesai. Entah tadi profit, loss, atau flat — yang penting hari ini kamu tetap disiplin di rencana.\n\n` +
    `📝 Catat hasil trading hari ini di journal\n` +
    `🔍 Evaluasi setup yang kena dan yang meleset\n` +
    `😴 Istirahat cukup, market masih ada besok\n\n` +
    `Tim &amp; sistem Auto Signal tetap memantau market malam ini. Sampai jumpa besok pagi dengan peluang baru.\n\n` +
    `Selamat istirahat 🌌\n\nlastquestion.store`
  );
}

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-cron-secret");
  if (secret !== CRON_SECRET) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const type = req.nextUrl.searchParams.get("type");
  const text = type === "night" ? nightMessage() : morningMessage();

  const vipResult = await sendToChannel(vipChannelId(), text);
  const publicResult = await sendToChannel(publicChannelId(), text);

  return NextResponse.json({ success: true, type: type || "morning", vip: vipResult, public: publicResult });
}
