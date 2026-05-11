import { createHmac, timingSafeEqual } from "node:crypto";
import {
  appendPurchase,
  ensureAccountEnv,
  getCreditPackCredits,
  type LocalUserAccount,
  type PurchaseRecord,
} from "~/lib/account/store";
import { getCreditPackConfig } from "./costs";

type StripeCheckoutSession = {
  id: string;
  url?: string;
  customer?: string;
  customer_email?: string;
  customer_details?: { email?: string };
  payment_intent?: string;
  amount_total?: number;
  currency?: string;
  payment_status?: string;
  mode?: string;
  livemode?: boolean;
  metadata?: Record<string, string>;
  line_items?: { data?: Array<{ price?: { id?: string } }> };
};

export type StripeWebhookEvent = {
  id: string;
  type: string;
  livemode: boolean;
  data: {
    object: StripeCheckoutSession & Record<string, unknown>;
  };
};

const getBaseUrl = () => process.env.APP_BASE_URL || "http://localhost:3000";

const requireStripeEnv = (priceEnvName = "STRIPE_PRICE_CREDIT_PACK") => {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  const priceId = process.env[priceEnvName];
  if (!secretKey) throw new Error("Stripe checkout is not configured: STRIPE_SECRET_KEY is missing.");
  if (!priceId) throw new Error(`Stripe checkout is not configured: ${priceEnvName} is missing.`);
  return { secretKey, priceId };
};

const stripeFetch = async <T>(
  stripePath: string,
  body: URLSearchParams,
  priceEnvName?: string,
) => {
  const { secretKey } = requireStripeEnv(priceEnvName);
  const response = await fetch(`https://api.stripe.com/v1${stripePath}`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${secretKey}`,
      "content-type": "application/x-www-form-urlencoded",
    },
    body,
  });
  const payload = (await response.json().catch(() => ({}))) as T & {
    error?: { message?: string };
  };
  if (!response.ok) {
    const message = payload.error?.message ?? "Stripe request failed.";
    throw new Error(`${message} Check that ${priceEnvName ?? "STRIPE_PRICE_CREDIT_PACK"} belongs to the same Stripe account and mode as STRIPE_SECRET_KEY.`);
  }
  return payload as T;
};

type CheckoutSessionOptions = {
  priceEnvName?: string;
  successPath?: string;
  cancelPath?: string;
  checkoutType?: string;
};

export const createCheckoutSession = async (
  user?: LocalUserAccount | null,
  options: CheckoutSessionOptions = {},
) => {
  await ensureAccountEnv();
  const { priceId } = requireStripeEnv(options.priceEnvName);
  const config = getCreditPackConfig();
  const params = new URLSearchParams();
  params.set("mode", "payment");
  params.set("success_url", `${getBaseUrl()}${options.successPath ?? "/account?checkout=success"}`);
  params.set("cancel_url", `${getBaseUrl()}${options.cancelPath ?? "/pricing?checkout=cancelled"}`);
  if (user) {
    params.set("customer_email", user.email);
    params.set("metadata[userId]", user.id);
  } else {
    params.set("customer_creation", "always");
  }
  params.set("line_items[0][price]", priceId);
  params.set("line_items[0][quantity]", "1");
  params.set("metadata[productType]", "credit_pack");
  params.set("metadata[credits]", String(config.credits));
  if (options.checkoutType) params.set("metadata[checkoutType]", options.checkoutType);
  params.set("allow_promotion_codes", "false");

  const session = await stripeFetch<StripeCheckoutSession>(
    "/checkout/sessions",
    params,
    options.priceEnvName,
  );
  if (!session.url) throw new Error("Stripe did not return a checkout URL.");

  if (user) {
    const now = new Date().toISOString();
    const purchase: PurchaseRecord = {
      id: crypto.randomUUID(),
      userId: user.id,
      stripeCheckoutSessionId: session.id,
      stripeCustomerId: typeof session.customer === "string" ? session.customer : undefined,
      stripePriceId: priceId,
      amountTotal: config.amountCents,
      currency: config.currency,
      creditsGranted: getCreditPackCredits(),
      status: "checkout_started",
      createdAt: now,
      updatedAt: now,
    };
    await appendPurchase(purchase);
  }

  return session.url;
};

export const constructStripeWebhookEvent = (
  rawBody: string,
  signatureHeader: string | null,
): StripeWebhookEvent => {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) throw new Error("Stripe webhook secret is not configured.");
  if (!signatureHeader) throw new Error("Stripe signature is missing.");

  const parts = new Map(
    signatureHeader.split(",").map((part) => {
      const [key, value] = part.split("=");
      return [key, value] as const;
    }),
  );
  const timestamp = parts.get("t");
  const signature = parts.get("v1");
  if (!timestamp || !signature) throw new Error("Stripe signature is malformed.");

  const signedPayload = `${timestamp}.${rawBody}`;
  const expected = createHmac("sha256", secret).update(signedPayload).digest("hex");
  const actual = Buffer.from(signature, "hex");
  const expectedBuffer = Buffer.from(expected, "hex");
  if (actual.length !== expectedBuffer.length || !timingSafeEqual(actual, expectedBuffer)) {
    throw new Error("Stripe signature verification failed.");
  }

  return JSON.parse(rawBody) as StripeWebhookEvent;
};
