import { recordEmailActivity } from "~/lib/account/store";

type MagicLinkEmailInput = {
  to: string;
  url: string;
  userId?: string;
  magicLinkId?: string;
};

export type TransactionalEmailResult = {
  delivery: "console" | "resend";
  emailId?: string;
  devUrl?: string;
};

const PRODUCT_NAME = process.env.PRODUCT_NAME || "Starter";
const SUPPORT_COPY =
  "If you did not request this link, you can ignore this email. Nothing will happen unless the link is opened.";

const escapeHtml = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

const createEmailHtml = (input: {
  title: string;
  body: string;
  buttonLabel: string;
  buttonUrl: string;
  detail?: string;
  footerCopy: string;
}) => {
  const url = escapeHtml(input.buttonUrl);
  return `<!doctype html>
<html>
  <body style="margin:0;background:#f6f6f6;padding:28px 16px;font-family:Inter,Arial,sans-serif;color:#18181b;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;border-collapse:collapse;background:#ffffff;border:1px solid #e4e4e7;border-radius:12px;overflow:hidden;">
            <tr>
              <td style="padding:24px 26px 16px;">
                <div style="font-size:11px;line-height:1.4;font-weight:800;text-transform:uppercase;letter-spacing:.08em;color:#71717a;">${escapeHtml(PRODUCT_NAME)}</div>
                <h1 style="margin:12px 0 0;font-size:24px;line-height:1.18;font-weight:800;color:#18181b;">${escapeHtml(input.title)}</h1>
                <p style="margin:10px 0 0;font-size:15px;line-height:1.5;color:#52525b;">${escapeHtml(input.body)}</p>
              </td>
            </tr>
            <tr>
              <td style="padding:4px 26px 26px;">
                <a href="${url}" style="display:inline-block;background:#18181b;color:#ffffff;text-decoration:none;border-radius:9px;padding:13px 16px;font-size:15px;line-height:1;font-weight:700;">${escapeHtml(input.buttonLabel)}</a>
                ${input.detail ? `<p style="margin:16px 0 0;font-size:13px;line-height:1.5;color:#71717a;">${escapeHtml(input.detail)}</p>` : ""}
              </td>
            </tr>
            <tr>
              <td style="padding:20px 26px;background:#fafafa;border-top:1px solid #e4e4e7;">
                <p style="margin:0;font-size:12px;line-height:1.5;color:#71717a;">${escapeHtml(input.footerCopy)}</p>
                <p style="margin:14px 0 0;font-size:12px;line-height:1.5;color:#71717a;">If the button does not work, paste this link into your browser:</p>
                <p style="margin:6px 0 0;font-size:11px;line-height:1.5;word-break:break-all;"><a href="${url}" style="color:#18181b;">${url}</a></p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
};

const createMagicLinkEmailHtml = (input: MagicLinkEmailInput) =>
  createEmailHtml({
    title: `Sign in to ${PRODUCT_NAME}`,
    body: `Use this secure link to sign in to ${PRODUCT_NAME}.`,
    buttonLabel: `Sign in to ${PRODUCT_NAME}`,
    buttonUrl: input.url,
    detail: `This link expires in 15 minutes and was requested for ${input.to}.`,
    footerCopy: SUPPORT_COPY,
  });

const createMagicLinkEmailText = (input: MagicLinkEmailInput) =>
  `Sign in to ${PRODUCT_NAME}\n\nUse this secure link to sign in:\n\n${input.url}\n\nThis link expires in 15 minutes and was requested for ${input.to}.\n\n${SUPPORT_COPY}`;

type ResendEmailPayload = {
  id?: string;
  message?: string;
};

export const sendMagicLinkEmail = async (
  input: MagicLinkEmailInput,
): Promise<TransactionalEmailResult> => {
  const subject = `Sign in to ${PRODUCT_NAME}`;
  if (process.env.EMAIL_DELIVERY !== "resend") {
    console.log(`${PRODUCT_NAME} sign-in link for ${input.to}: ${input.url}`);
    await recordEmailActivity({
      kind: "magic_link",
      delivery: "console",
      status: "sent",
      to: input.to,
      subject,
      relatedUserId: input.userId,
      relatedMagicLinkId: input.magicLinkId,
    });
    return { delivery: "console", devUrl: input.url };
  }

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!apiKey || !from) throw new Error("Resend email is not configured.");

  let failureLogged = false;
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        authorization: `Bearer ${apiKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: input.to,
        subject,
        html: createMagicLinkEmailHtml(input),
        text: createMagicLinkEmailText(input),
      }),
    });
    const payload = (await response.json().catch(() => ({}))) as ResendEmailPayload;
    if (!response.ok) {
      const message = payload.message ?? "Email could not be sent.";
      await recordEmailActivity({
        kind: "magic_link",
        delivery: "resend",
        status: "failed",
        to: input.to,
        subject,
        relatedUserId: input.userId,
        relatedMagicLinkId: input.magicLinkId,
        error: message,
      });
      failureLogged = true;
      throw new Error(message);
    }
    await recordEmailActivity({
      kind: "magic_link",
      delivery: "resend",
      status: "sent",
      to: input.to,
      subject,
      relatedUserId: input.userId,
      relatedMagicLinkId: input.magicLinkId,
      resendEmailId: payload.id,
    });
    return { delivery: "resend", emailId: payload.id };
  } catch (error) {
    if (!failureLogged && error instanceof Error) {
      await recordEmailActivity({
        kind: "magic_link",
        delivery: "resend",
        status: "failed",
        to: input.to,
        subject,
        relatedUserId: input.userId,
        relatedMagicLinkId: input.magicLinkId,
        error: error.message,
      }).catch(() => undefined);
    }
    throw error;
  }
};
