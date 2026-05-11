import type { APIEvent } from "@solidjs/start/server";
import { requireSuperUser } from "~/lib/account/admin";
import { getAnalyticsSnapshot } from "~/lib/admin/analytics";

export async function GET(event: APIEvent) {
  const auth = await requireSuperUser(event);
  if (!auth.ok) return auth.response;
  return Response.json(await getAnalyticsSnapshot());
}
