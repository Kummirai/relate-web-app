/**
 * Transactional email via Brevo.
 *
 * Board governance uses this to email every board member when a meeting is
 * scheduled, changed, or minutes are published. Email is a courtesy channel:
 * when BREVO_API_KEY is not configured every call is a no-op so the in-app and
 * push notifications still go out.
 */

const BREVO_API_KEY = process.env.BREVO_API_KEY || "";
const SENDER_EMAIL = process.env.BREVO_SENDER_EMAIL || "";
const SENDER_NAME = process.env.BREVO_SENDER_NAME || "Relate World";

export type EmailRecipient = { email?: string | null; name?: string | null };

export function isEmailConfigured(): boolean {
  return !!(BREVO_API_KEY && SENDER_EMAIL);
}

function htmlFor(paragraphs: string[]): string {
  const body = paragraphs
    .filter(Boolean)
    .map(
      (p) =>
        `<p style="margin:0 0 12px;font-size:14px;line-height:1.6;color:#1d2a4d">${p
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/\n/g, "<br/>")}</p>`,
    )
    .join("");
  return `<div style="background:#f4f7f6;padding:24px;font-family:Arial,Helvetica,sans-serif">
    <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:16px;padding:28px">
      <p style="margin:0 0 18px;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#b8860b">Relate World · Board</p>
      ${body}
      <p style="margin:24px 0 0;font-size:11px;color:#8494a6">Sent from the Relate World board governance portal.</p>
    </div>
  </div>`;
}

/**
 * Sends one branded email per recipient. Failures are logged, never thrown —
 * a mail outage must not fail the meeting/minutes write that triggered it.
 */
export async function sendBoardEmails(
  recipients: EmailRecipient[],
  subject: string,
  paragraphs: string[],
): Promise<number> {
  if (!isEmailConfigured()) {
    console.warn("[mailer] BREVO_API_KEY/BREVO_SENDER_EMAIL not configured — email skipped.");
    return 0;
  }

  const seen = new Set<string>();
  const targets = recipients
    .map((r) => ({ email: (r.email || "").trim(), name: (r.name || "").trim() }))
    .filter((r) => {
      const key = r.email.toLowerCase();
      if (!r.email || !r.email.includes("@") || seen.has(key)) return false;
      seen.add(key);
      return true;
    });

  const htmlContent = htmlFor(paragraphs);
  let sent = 0;
  for (const target of targets) {
    try {
      const res = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          "api-key": BREVO_API_KEY,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          sender: { name: SENDER_NAME, email: SENDER_EMAIL },
          to: [{ email: target.email, name: target.name || target.email }],
          subject,
          htmlContent,
        }),
      });
      if (!res.ok) {
        const detail = await res.text().catch(() => "");
        console.error(`[mailer] Brevo ${res.status}: ${detail.slice(0, 300)}`);
        continue;
      }
      sent += 1;
    } catch (e) {
      console.error("[mailer] Brevo request failed", e);
    }
  }
  return sent;
}
