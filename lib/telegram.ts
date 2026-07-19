export async function sendTelegramMessage(text: string): Promise<{ ok: boolean; error?: string }> {
  const token = process.env.TELEGRAM_SIGNAL_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_SIGNAL_CHANNEL_ID;

  if (!token || !chatId) {
    return { ok: false, error: "Telegram bot token or channel id not configured" };
  }

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
    });
    const json = await res.json();
    if (!json.ok) {
      return { ok: false, error: json.description || "Telegram API error" };
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}
