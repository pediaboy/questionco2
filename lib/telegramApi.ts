// Low-level Telegram Bot API helpers used by the admin bot webhook.
// Keeps app/api/telegram-webhook/route.ts focused on flow/state logic.

const TG_API = "https://api.telegram.org/bot";

function botToken(): string {
  const token = process.env.TELEGRAM_SIGNAL_BOT_TOKEN;
  if (!token) throw new Error("TELEGRAM_SIGNAL_BOT_TOKEN not configured");
  return token;
}

async function call(method: string, payload: Record<string, unknown>) {
  const res = await fetch(`${TG_API}${botToken()}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const json = await res.json().catch(() => ({}));
  return json;
}

export type InlineKeyboard = { text: string; callback_data: string }[][];

export async function sendMessage(chatId: number | string, text: string, keyboard?: InlineKeyboard) {
  return call("sendMessage", {
    chat_id: chatId,
    text,
    parse_mode: "HTML",
    disable_web_page_preview: true,
    ...(keyboard ? { reply_markup: { inline_keyboard: keyboard } } : {}),
  });
}

export async function editMessageText(
  chatId: number | string,
  messageId: number,
  text: string,
  keyboard?: InlineKeyboard
) {
  return call("editMessageText", {
    chat_id: chatId,
    message_id: messageId,
    text,
    parse_mode: "HTML",
    disable_web_page_preview: true,
    ...(keyboard ? { reply_markup: { inline_keyboard: keyboard } } : { reply_markup: { inline_keyboard: [] } }),
  });
}

export async function deleteMessage(chatId: number | string, messageId: number) {
  return call("deleteMessage", { chat_id: chatId, message_id: messageId });
}

export async function answerCallbackQuery(callbackQueryId: string, text?: string) {
  return call("answerCallbackQuery", {
    callback_query_id: callbackQueryId,
    ...(text ? { text, show_alert: false } : {}),
  });
}

export async function setWebhook(url: string) {
  return call("setWebhook", { url, allowed_updates: ["message", "callback_query"] });
}

/** Send a plain outbound message to any channel/chat id (used for VIP/public signal routing + greetings). */
export async function sendToChannel(chatId: string | number, text: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const json = await call("sendMessage", {
      chat_id: chatId,
      text,
      parse_mode: "HTML",
      disable_web_page_preview: true,
    });
    if (!json.ok) return { ok: false, error: json.description || "Telegram API error" };
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}
