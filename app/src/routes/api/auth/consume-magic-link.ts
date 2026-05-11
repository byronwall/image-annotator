import type { APIEvent } from "@solidjs/start/server";
import { createUserSessionCookie } from "~/lib/account/session";
import { consumeMagicLinkToken } from "~/lib/account/store";

const isSafeNextPath = (value: string | undefined) =>
  value && value.startsWith("/") && !value.startsWith("//") ? value : "/";

export async function GET(event: APIEvent) {
  try {
    const url = new URL(event.request.url);
    const token = url.searchParams.get("token");
    if (!token) throw new Error("Sign-in token is missing.");
    const { user, nextPath } = await consumeMagicLinkToken(token);
    return new Response(null, {
      status: 302,
      headers: {
        "set-cookie": await createUserSessionCookie(user.id),
        location: isSafeNextPath(nextPath),
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Sign-in failed.";
    return Response.json({ error: message }, { status: 400 });
  }
}
