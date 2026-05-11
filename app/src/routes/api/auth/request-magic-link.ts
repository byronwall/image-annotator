import type { APIEvent } from "@solidjs/start/server";
import { createSignInLink } from "~/lib/account/magic-link";
import { sendMagicLinkEmail } from "~/lib/email/send";

const getBaseUrl = (request: Request) =>
  process.env.APP_BASE_URL || new URL(request.url).origin;

export async function POST(event: APIEvent) {
  try {
    const input = (await event.request.json().catch(() => ({}))) as {
      email?: unknown;
      next?: unknown;
    };
    const email = String(input.email ?? "").trim();
    const nextPath = String(input.next ?? "").trim() || undefined;
    if (!email || !email.includes("@")) throw new Error("Enter a valid email address.");

    const { user, link, url } = await createSignInLink({
      email,
      baseUrl: getBaseUrl(event.request),
      nextPath,
    });
    const delivery = await sendMagicLinkEmail({
      to: user.email,
      url,
      userId: user.id,
      magicLinkId: link.id,
    });
    return Response.json({
      ok: true,
      delivery: delivery.delivery,
      devUrl: delivery.devUrl,
    });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Sign-in link could not be sent." },
      { status: 400 },
    );
  }
}
