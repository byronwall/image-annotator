import type { APIEvent } from "@solidjs/start/server";
import {
  ensureAccountEnv,
  markCheckoutFailed,
  markCheckoutPaid,
  recordStripeEventFailure,
  recordStripeEventIgnored,
  upsertUserByEmail,
} from "~/lib/account/store";
import { constructStripeWebhookEvent } from "~/lib/billing/stripe";

type CheckoutSessionLike = {
  line_items?: { data?: Array<{ price?: { id?: string } }> };
  metadata?: Record<string, string>;
};

const getSessionPriceId = (session: CheckoutSessionLike) =>
  session.line_items?.data?.[0]?.price?.id;

const isCreditPackCheckout = (session: CheckoutSessionLike) =>
  session.metadata?.productType === "credit_pack";

const hasExpectedPrice = (session: CheckoutSessionLike) => {
  const actualPriceId = getSessionPriceId(session);
  const expectedPriceIds = [process.env.STRIPE_PRICE_CREDIT_PACK].filter(Boolean);
  return !expectedPriceIds.length || !actualPriceId || expectedPriceIds.includes(actualPriceId);
};

export async function POST(event: APIEvent) {
  await ensureAccountEnv();
  const rawBody = await event.request.text();
  let stripeEvent;
  try {
    stripeEvent = constructStripeWebhookEvent(
      rawBody,
      event.request.headers.get("stripe-signature"),
    );
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Invalid Stripe webhook." },
      { status: 400 },
    );
  }

  try {
    const object = stripeEvent.data.object;

    if (stripeEvent.type === "checkout.session.completed") {
      if (object.mode !== "payment" || object.payment_status !== "paid") {
        await recordStripeEventIgnored({
          stripeEventId: stripeEvent.id,
          type: stripeEvent.type,
          livemode: stripeEvent.livemode,
          error: "Checkout session was not a paid one-time payment.",
        });
        return Response.json({ ok: true, ignored: true });
      }
      if (!isCreditPackCheckout(object)) {
        await recordStripeEventIgnored({
          stripeEventId: stripeEvent.id,
          type: stripeEvent.type,
          livemode: stripeEvent.livemode,
          error: "Checkout session does not belong to the credit-pack product.",
        });
        return Response.json({ ok: true, ignored: true });
      }
      if (!hasExpectedPrice(object)) {
        await recordStripeEventIgnored({
          stripeEventId: stripeEvent.id,
          type: stripeEvent.type,
          livemode: stripeEvent.livemode,
          error: "Checkout session price does not match a configured credit-pack price.",
        });
        return Response.json({ ok: true, ignored: true });
      }
      const existingUserId = object.metadata?.userId;
      const checkoutEmail = object.customer_details?.email ?? object.customer_email;
      const user = existingUserId
        ? { id: existingUserId }
        : checkoutEmail
          ? await upsertUserByEmail(checkoutEmail)
          : null;
      if (!user) throw new Error("Stripe checkout session is missing customer email.");
      await markCheckoutPaid({
        stripeEventId: stripeEvent.id,
        eventType: stripeEvent.type,
        livemode: stripeEvent.livemode,
        checkoutSessionId: object.id,
        paymentIntentId:
          typeof object.payment_intent === "string" ? object.payment_intent : undefined,
        stripeCustomerId: typeof object.customer === "string" ? object.customer : undefined,
        stripePriceId: getSessionPriceId(object),
        userId: user.id,
        amountTotal: Number(object.amount_total ?? 1000),
        currency: String(object.currency ?? "usd"),
        creditsGranted: Number(object.metadata?.credits ?? process.env.CREDIT_PACK_CREDITS ?? 10),
      });
    } else if (
      stripeEvent.type === "checkout.session.expired" ||
      stripeEvent.type === "payment_intent.payment_failed"
    ) {
      await markCheckoutFailed({
        stripeEventId: stripeEvent.id,
        eventType: stripeEvent.type,
        livemode: stripeEvent.livemode,
        checkoutSessionId: object.id?.startsWith("cs_") ? object.id : undefined,
        paymentIntentId: object.id?.startsWith("pi_") ? object.id : undefined,
        error:
          typeof object.last_payment_error === "object" &&
          object.last_payment_error &&
          "message" in object.last_payment_error
            ? String(object.last_payment_error.message)
            : undefined,
      });
    }

    return Response.json({ ok: true });
  } catch (error) {
    await recordStripeEventFailure({
      stripeEventId: stripeEvent.id,
      type: stripeEvent.type,
      livemode: stripeEvent.livemode,
      error: error instanceof Error ? error.message : "Stripe webhook failed.",
    });
    return Response.json(
      { error: error instanceof Error ? error.message : "Stripe webhook failed." },
      { status: 400 },
    );
  }
}
