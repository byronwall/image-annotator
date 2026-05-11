import type { APIEvent } from "@solidjs/start/server";
import { getCurrentAccountSnapshot } from "~/lib/account/session";

export async function GET(event: APIEvent) {
  return Response.json(await getCurrentAccountSnapshot(event));
}
