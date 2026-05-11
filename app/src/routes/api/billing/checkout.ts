import type { APIEvent } from "@solidjs/start/server";
import { getCurrentUser } from "~/lib/account/session";
import { createCheckoutSession } from "~/lib/billing/stripe";

export async function POST(event: APIEvent) {
  try {
    const user = await getCurrentUser(event);
    const checkoutUrl = await createCheckoutSession(user);
    return Response.json({ checkoutUrl });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Checkout could not be started." },
      { status: 400 },
    );
  }
}
