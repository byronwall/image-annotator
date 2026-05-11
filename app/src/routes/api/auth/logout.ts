import type { APIEvent } from "@solidjs/start/server";
import { clearSessionCookie, revokeCurrentSession } from "~/lib/account/session";

export async function POST(event: APIEvent) {
  await revokeCurrentSession(event);
  return Response.json(
    { ok: true },
    {
      headers: {
        "set-cookie": clearSessionCookie(),
      },
    },
  );
}
