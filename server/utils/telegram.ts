/**
 * Telegram alerts for the person running the server (not for customers).
 *
 * Set TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID (optional APP_LABEL) to turn it on.
 * Without them every function here is a silent no-op, so it is safe to ship.
 *
 * - Never throws and never blocks a request: callers use alertOps() (fire and forget).
 * - Flood protection: at most 20 messages per rolling minute, and `key` + `cooldownMs`
 *   lets noisy events (like a repeating 500 error) alert once per cooldown.
 */

const MAX_PER_MINUTE = 20;
const MAX_KEYS = 500;

let windowStart = 0;
let sentInWindow = 0;
const lastByKey = new Map<string, number>();

const token = () => process.env.TELEGRAM_BOT_TOKEN?.trim();
const chat = () => process.env.TELEGRAM_CHAT_ID?.trim();

export const telegramConfigured = () => Boolean(token() && chat());

/** Escape text that goes inside a Telegram HTML message. */
export const escapeHtml = (value: unknown) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

/** Short, escaped, single-line version of an error for use in a message. */
export const errorText = (error: any, max = 300) =>
  escapeHtml(String(error?.message ?? error ?? "unknown error").replace(/\s+/g, " ").slice(0, max));

type Options = {
  /** Same key within cooldownMs is sent only once. */
  key?: string;
  /** Default 10 minutes. */
  cooldownMs?: number;
};

/** Returns true when Telegram accepted the message. */
export const sendTelegram = async (text: string, options: Options = {}): Promise<boolean> => {
  try {
    if (!telegramConfigured()) return false;

    const now = Date.now();
    if (options.key) {
      const last = lastByKey.get(options.key) ?? 0;
      if (now - last < (options.cooldownMs ?? 10 * 60_000)) return false;
      lastByKey.set(options.key, now);
      if (lastByKey.size > MAX_KEYS) {
        const oldest = [...lastByKey.entries()].sort((a, b) => a[1] - b[1]).slice(0, MAX_KEYS / 2);
        for (const [k] of oldest) lastByKey.delete(k);
      }
    }

    if (now - windowStart > 60_000) {
      windowStart = now;
      sentInWindow = 0;
    }
    if (sentInWindow >= MAX_PER_MINUTE) return false;
    sentInWindow++;

    const label = escapeHtml(process.env.APP_LABEL?.trim() || "estore");
    const response = await fetch(`https://api.telegram.org/bot${token()}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chat(),
        text: `<b>${label}</b>\n${text}`.slice(0, 4000),
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) {
      console.error("Telegram send failed: HTTP", response.status);
      return false;
    }
    return true;
  } catch (error: any) {
    // log the message only: it must never contain the bot token
    console.error("Telegram send error:", error?.name || "error");
    return false;
  }
};

/** Fire and forget. Use this inside request handlers. */
export const alertOps = (text: string, options?: Options) => {
  void sendTelegram(text, options);
};
