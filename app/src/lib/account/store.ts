import { createHash, randomBytes, randomUUID } from "node:crypto";
import { mkdir, readFile, rename, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";

export type LocalUserAccount = {
  id: string;
  email: string;
  createdAt: string;
  updatedAt: string;
  stripeCustomerId?: string;
  lastLoginAt?: string;
  magicLinkLoginCount?: number;
};

export type SessionRecord = {
  id: string;
  userId: string;
  createdAt: string;
  expiresAt: string;
  revokedAt?: string;
};

export type MagicLinkRecord = {
  id: string;
  userId: string;
  tokenHash: string;
  email: string;
  nextPath?: string;
  createdAt: string;
  expiresAt: string;
  consumedAt?: string;
};

export type CreditLedgerEntry = {
  id: string;
  userId: string;
  type: "purchase" | "usage" | "admin_adjustment";
  amount: number;
  balanceAfter: number;
  sourceId?: string;
  note?: string;
  createdAt: string;
};

export type PurchaseRecord = {
  id: string;
  userId: string;
  stripeEventId?: string;
  stripeCheckoutSessionId?: string;
  stripePaymentIntentId?: string;
  stripeCustomerId?: string;
  stripePriceId?: string;
  amountTotal: number;
  currency: string;
  creditsGranted: number;
  status: "checkout_started" | "paid" | "failed";
  createdAt: string;
  updatedAt: string;
};

export type StripeEventRecord = {
  id: string;
  type: string;
  livemode: boolean;
  relatedUserId?: string;
  relatedPurchaseId?: string;
  status: "processed" | "ignored" | "failed";
  error?: string;
  createdAt: string;
  processedAt: string;
};

export type AdminActionLogRecord = {
  id: string;
  action: "grant_credits";
  actorUserId: string;
  actorEmail: string;
  targetUserId: string;
  targetEmail: string;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  ledgerEntryId?: string;
  note?: string;
  requestIp?: string;
  userAgent?: string;
  createdAt: string;
};

export type EmailActivityLogRecord = {
  id: string;
  kind: "magic_link" | "credit_grant" | "transactional";
  delivery: "console" | "resend";
  status: "sent" | "failed" | "skipped";
  to: string;
  subject: string;
  relatedUserId?: string;
  relatedMagicLinkId?: string;
  resendEmailId?: string;
  error?: string;
  createdAt: string;
};

export type SiteErrorRecord = {
  id: string;
  title: string;
  message: string;
  errorName?: string;
  errorMessage?: string;
  stack?: string;
  path?: string;
  userAgent?: string;
  createdAt: string;
};

export type AccountStore = {
  schemaVersion: 1;
  users: LocalUserAccount[];
  sessions: SessionRecord[];
  magicLinks: MagicLinkRecord[];
  creditLedger: CreditLedgerEntry[];
  purchases: PurchaseRecord[];
  stripeEvents: StripeEventRecord[];
  adminActionLogs: AdminActionLogRecord[];
  emailActivityLogs: EmailActivityLogRecord[];
  siteErrors: SiteErrorRecord[];
};

export type AccountSnapshot = {
  user: (LocalUserAccount & { isAdmin?: boolean }) | null;
  creditBalance: number;
  creditPackCredits: number;
  purchases: PurchaseRecord[];
  creditLedger: CreditLedgerEntry[];
  emailDeliveryMode: "console" | "resend";
  stripeConfigured: boolean;
  devMode: boolean;
  superUserEmail: string;
};

const nowIso = () => new Date().toISOString();

const getWorkspaceRoot = () => {
  const cwd = process.cwd();
  return path.basename(cwd) === "app" ? path.dirname(cwd) : cwd;
};

const getAppRoot = () => path.join(getWorkspaceRoot(), "app");
const getRuntimeDataDir = () => {
  const configured = process.env.APP_DATA_DIR?.trim();
  if (!configured) return path.join(getAppRoot(), "data");
  return path.isAbsolute(configured)
    ? configured
    : path.join(getWorkspaceRoot(), configured);
};
const getDataDir = () => path.join(getRuntimeDataDir(), "account");
const getStorePath = () => path.join(getDataDir(), "store.json");
const getStoreLockPath = () => path.join(getDataDir(), "store.lock");
let envLoaded = false;
let accountWriteQueue = Promise.resolve();
const storeLockTimeoutMs = 5_000;
const staleStoreLockMs = 30_000;

const parseEnvFile = (content: string) =>
  Object.fromEntries(
    content
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#"))
      .map((line) => {
        const index = line.indexOf("=");
        if (index === -1) return [line, ""];
        return [
          line.slice(0, index).trim(),
          line.slice(index + 1).trim().replace(/^["']|["']$/g, ""),
        ];
      }),
  );

const fileExists = async (filePath: string) => {
  try {
    await stat(filePath);
    return true;
  } catch {
    return false;
  }
};

export const ensureAccountEnv = async () => {
  if (envLoaded) return;
  envLoaded = true;
  const envPath = path.join(getAppRoot(), ".env");
  if (!(await fileExists(envPath))) return;
  const env = parseEnvFile(await readFile(envPath, "utf8"));
  for (const [key, value] of Object.entries(env)) {
    if (!process.env[key] && value) process.env[key] = value;
  }
};

const writeJsonFile = async (filePath: string, value: unknown) => {
  await mkdir(path.dirname(filePath), { recursive: true });
  const tempPath = `${filePath}.${process.pid}.${randomUUID()}.tmp`;
  await writeFile(tempPath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  await rename(tempPath, filePath);
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const acquireAccountStoreLock = async () => {
  const lockPath = getStoreLockPath();
  const startedAt = Date.now();
  await mkdir(path.dirname(lockPath), { recursive: true });

  while (true) {
    try {
      await mkdir(lockPath);
      return async () => {
        await rm(lockPath, { force: true, recursive: true });
      };
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
      const lockStat = await stat(lockPath).catch(() => null);
      if (lockStat && Date.now() - lockStat.mtimeMs > staleStoreLockMs) {
        await rm(lockPath, { force: true, recursive: true });
        continue;
      }
      if (Date.now() - startedAt > storeLockTimeoutMs) {
        throw new Error("Timed out waiting for the account store lock.");
      }
      await sleep(25);
    }
  }
};

const queueAccountStoreWrite = async <T,>(write: () => Promise<T>) => {
  const pendingWrite = accountWriteQueue.then(async () => {
    const releaseLock = await acquireAccountStoreLock();
    try {
      return await write();
    } finally {
      await releaseLock();
    }
  });
  accountWriteQueue = pendingWrite.then(
    () => undefined,
    () => undefined,
  );
  return pendingWrite;
};

export const normalizeEmail = (email: string) => email.trim().toLowerCase();

const getConfiguredSuperUserEmail = () =>
  normalizeEmail(process.env.SUPER_USER_EMAIL || "owner@example.com");

export const hashToken = (token: string) =>
  createHash("sha256").update(token).digest("hex");

export const createOpaqueToken = () => randomBytes(32).toString("base64url");

const createEmptyStore = (): AccountStore => ({
  schemaVersion: 1,
  users: [],
  sessions: [],
  magicLinks: [],
  creditLedger: [],
  purchases: [],
  stripeEvents: [],
  adminActionLogs: [],
  emailActivityLogs: [],
  siteErrors: [],
});

const seedSuperUser = (store: AccountStore) => {
  const email = getConfiguredSuperUserEmail();
  const existing = store.users.find(
    (user) => user.id === "user-super-admin" || user.email === email,
  );
  if (existing) {
    existing.email = email;
    existing.updatedAt = nowIso();
    return;
  }
  const createdAt = nowIso();
  store.users.push({ id: "user-super-admin", email, createdAt, updatedAt: createdAt });
};

export const readAccountStore = async (): Promise<AccountStore> => {
  await ensureAccountEnv();
  const filePath = getStorePath();
  const parsed = (await fileExists(filePath))
    ? (JSON.parse(await readFile(filePath, "utf8")) as Partial<AccountStore>)
    : {};
  const store: AccountStore = {
    ...createEmptyStore(),
    ...parsed,
    schemaVersion: 1,
    users: parsed.users ?? [],
    sessions: parsed.sessions ?? [],
    magicLinks: parsed.magicLinks ?? [],
    creditLedger: parsed.creditLedger ?? [],
    purchases: parsed.purchases ?? [],
    stripeEvents: parsed.stripeEvents ?? [],
    adminActionLogs: parsed.adminActionLogs ?? [],
    emailActivityLogs: parsed.emailActivityLogs ?? [],
    siteErrors: parsed.siteErrors ?? [],
  };
  seedSuperUser(store);
  return store;
};

export const writeAccountStore = async <T,>(
  update: (store: AccountStore) => T | Promise<T>,
) =>
  queueAccountStoreWrite(async () => {
    const store = await readAccountStore();
    const result = await update(store);
    await writeJsonFile(getStorePath(), store);
    return result;
  });

export const getCreditPackCredits = () => {
  const value = Number(process.env.CREDIT_PACK_CREDITS ?? 10);
  return Number.isFinite(value) && value > 0 ? Math.floor(value) : 10;
};

export const recordSiteError = async (
  input: Omit<SiteErrorRecord, "id" | "createdAt">,
) =>
  writeAccountStore((store) => {
    const record: SiteErrorRecord = {
      ...input,
      id: randomUUID(),
      title: input.title.slice(0, 160),
      message: input.message.slice(0, 500),
      errorName: input.errorName?.slice(0, 120),
      errorMessage: input.errorMessage?.slice(0, 500),
      stack: input.stack?.slice(0, 8000),
      path: input.path?.slice(0, 500),
      userAgent: input.userAgent?.slice(0, 500),
      createdAt: nowIso(),
    };
    store.siteErrors.unshift(record);
    store.siteErrors = store.siteErrors.slice(0, 100);
    return record;
  });

export const upsertUserByEmail = async (email: string) =>
  writeAccountStore((store) => {
    const normalized = normalizeEmail(email);
    const existing = store.users.find((user) => user.email === normalized);
    if (existing) {
      existing.updatedAt = nowIso();
      return existing;
    }
    const createdAt = nowIso();
    const user = {
      id: `user-${randomUUID()}`,
      email: normalized,
      createdAt,
      updatedAt: createdAt,
    };
    store.users.push(user);
    return user;
  });

export const getUserCreditBalanceFromStore = (store: AccountStore, userId: string) =>
  store.creditLedger
    .filter((entry) => entry.userId === userId)
    .reduce((sum, entry) => sum + entry.amount, 0);

const appendLedgerEntry = (
  store: AccountStore,
  input: Omit<CreditLedgerEntry, "id" | "balanceAfter" | "createdAt">,
) => {
  const balanceAfter = getUserCreditBalanceFromStore(store, input.userId) + input.amount;
  const entry = { ...input, id: randomUUID(), balanceAfter, createdAt: nowIso() };
  store.creditLedger.push(entry);
  return entry;
};

export const grantCredits = async (input: {
  userId: string;
  amount: number;
  sourceId?: string;
  note?: string;
}) =>
  writeAccountStore((store) =>
    appendLedgerEntry(store, {
      userId: input.userId,
      type: "purchase",
      amount: Math.abs(input.amount),
      sourceId: input.sourceId,
      note: input.note,
    }),
  );

export const consumeCredit = async (input: {
  userId: string;
  amount?: number;
  sourceId?: string;
  note?: string;
}) =>
  writeAccountStore((store) => {
    const amount = Math.max(1, Math.floor(input.amount ?? 1));
    if (getUserCreditBalanceFromStore(store, input.userId) < amount) {
      throw new Error("Not enough credits.");
    }
    return appendLedgerEntry(store, {
      userId: input.userId,
      type: "usage",
      amount: -amount,
      sourceId: input.sourceId,
      note: input.note,
    });
  });

export const appendPurchase = async (purchase: PurchaseRecord) =>
  writeAccountStore((store) => {
    const existing = store.purchases.find(
      (item) =>
        item.stripeCheckoutSessionId &&
        item.stripeCheckoutSessionId === purchase.stripeCheckoutSessionId,
    );
    if (existing) {
      Object.assign(existing, { ...purchase, id: existing.id });
      return existing;
    }
    store.purchases.push(purchase);
    return purchase;
  });

export const createMagicLink = async (
  userId: string,
  email: string,
  nextPath?: string,
  expiresInMs = 15 * 60 * 1000,
) => {
  const token = createOpaqueToken();
  const expiresAt = new Date(Date.now() + expiresInMs).toISOString();
  const link = await writeAccountStore((store) => {
    const record = {
      id: randomUUID(),
      userId,
      email,
      nextPath,
      tokenHash: hashToken(token),
      createdAt: nowIso(),
      expiresAt,
    };
    store.magicLinks.push(record);
    return record;
  });
  return { token, link };
};

export const consumeMagicLinkToken = async (token: string) =>
  writeAccountStore((store) => {
    const link = store.magicLinks.find(
      (item) =>
        item.tokenHash === hashToken(token) &&
        !item.consumedAt &&
        item.expiresAt > nowIso(),
    );
    if (!link) throw new Error("Sign-in link is invalid or expired.");
    link.consumedAt = nowIso();
    const user = store.users.find((item) => item.id === link.userId);
    if (!user) throw new Error("User not found.");
    user.lastLoginAt = nowIso();
    user.magicLinkLoginCount = (user.magicLinkLoginCount ?? 0) + 1;
    user.updatedAt = nowIso();
    return { user, nextPath: link.nextPath };
  });

export const recordEmailActivity = async (
  input: Omit<EmailActivityLogRecord, "id" | "createdAt">,
) =>
  writeAccountStore((store) => {
    const log = {
      ...input,
      id: randomUUID(),
      to: normalizeEmail(input.to),
      createdAt: nowIso(),
    };
    store.emailActivityLogs.push(log);
    return log;
  });

export const createSession = async (userId: string) =>
  writeAccountStore((store) => {
    const createdAt = nowIso();
    const session = {
      id: `session-${createOpaqueToken()}`,
      userId,
      createdAt,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    };
    store.sessions.push(session);
    return session;
  });

export const revokeSession = async (sessionId: string) =>
  writeAccountStore((store) => {
    const session = store.sessions.find((item) => item.id === sessionId);
    if (session && !session.revokedAt) session.revokedAt = nowIso();
  });

export const getUserBySessionId = async (sessionId: string | undefined) => {
  if (!sessionId) return null;
  const store = await readAccountStore();
  const session = store.sessions.find(
    (item) => item.id === sessionId && !item.revokedAt && item.expiresAt > nowIso(),
  );
  if (!session) return null;
  return store.users.find((user) => user.id === session.userId) ?? null;
};

export const getAccountSnapshotForUser = async (
  user: (LocalUserAccount & { isAdmin?: boolean }) | null,
): Promise<AccountSnapshot> => {
  const store = await readAccountStore();
  return {
    user,
    creditBalance: user ? getUserCreditBalanceFromStore(store, user.id) : 0,
    creditPackCredits: getCreditPackCredits(),
    purchases: user
      ? store.purchases
          .filter((purchase) => purchase.userId === user.id)
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      : [],
    creditLedger: user
      ? store.creditLedger
          .filter((entry) => entry.userId === user.id)
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      : [],
    emailDeliveryMode: process.env.EMAIL_DELIVERY === "resend" ? "resend" : "console",
    stripeConfigured: Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_PRICE_CREDIT_PACK),
    devMode: process.env.NODE_ENV !== "production",
    superUserEmail: getConfiguredSuperUserEmail(),
  };
};

export const markCheckoutPaid = async (input: {
  stripeEventId: string;
  checkoutSessionId: string;
  paymentIntentId?: string;
  stripeCustomerId?: string;
  stripePriceId?: string;
  userId: string;
  amountTotal: number;
  currency: string;
  creditsGranted: number;
  livemode: boolean;
  eventType: string;
}) =>
  writeAccountStore((store) => {
    if (store.stripeEvents.find((event) => event.id === input.stripeEventId)?.status === "processed") {
      return { granted: false, reason: "duplicate" as const };
    }
    const user = store.users.find((item) => item.id === input.userId);
    if (!user) throw new Error("Stripe event user not found.");
    if (input.stripeCustomerId) user.stripeCustomerId = input.stripeCustomerId;
    user.updatedAt = nowIso();

    let purchase = store.purchases.find(
      (item) => item.stripeCheckoutSessionId === input.checkoutSessionId,
    );
    if (!purchase) {
      purchase = {
        id: randomUUID(),
        userId: input.userId,
        stripeCheckoutSessionId: input.checkoutSessionId,
        amountTotal: input.amountTotal,
        currency: input.currency,
        creditsGranted: input.creditsGranted,
        status: "checkout_started",
        createdAt: nowIso(),
        updatedAt: nowIso(),
      };
      store.purchases.push(purchase);
    }

    const alreadyPaid = purchase.status === "paid";
    Object.assign(purchase, {
      stripeEventId: input.stripeEventId,
      stripePaymentIntentId: input.paymentIntentId,
      stripeCustomerId: input.stripeCustomerId,
      stripePriceId: input.stripePriceId,
      amountTotal: input.amountTotal,
      currency: input.currency,
      creditsGranted: input.creditsGranted,
      status: "paid" as const,
      updatedAt: nowIso(),
    });

    if (!alreadyPaid) {
      appendLedgerEntry(store, {
        userId: input.userId,
        type: "purchase",
        amount: input.creditsGranted,
        sourceId: purchase.id,
        note: "Stripe credit pack purchase.",
      });
    }

    store.stripeEvents.push({
      id: input.stripeEventId,
      type: input.eventType,
      livemode: input.livemode,
      relatedUserId: input.userId,
      relatedPurchaseId: purchase.id,
      status: alreadyPaid ? "ignored" : "processed",
      createdAt: nowIso(),
      processedAt: nowIso(),
    });
    return { granted: !alreadyPaid, reason: alreadyPaid ? ("duplicate" as const) : undefined };
  });

export const markCheckoutFailed = async (input: {
  stripeEventId: string;
  checkoutSessionId?: string;
  paymentIntentId?: string;
  eventType: string;
  livemode: boolean;
  error?: string;
}) =>
  writeAccountStore((store) => {
    const purchase = store.purchases.find(
      (item) =>
        (input.checkoutSessionId && item.stripeCheckoutSessionId === input.checkoutSessionId) ||
        (input.paymentIntentId && item.stripePaymentIntentId === input.paymentIntentId),
    );
    if (purchase) {
      purchase.status = "failed";
      purchase.updatedAt = nowIso();
    }
    store.stripeEvents.push({
      id: input.stripeEventId,
      type: input.eventType,
      livemode: input.livemode,
      relatedUserId: purchase?.userId,
      relatedPurchaseId: purchase?.id,
      status: "processed",
      error: input.error,
      createdAt: nowIso(),
      processedAt: nowIso(),
    });
  });

export const recordStripeEventFailure = async (input: {
  stripeEventId: string;
  type: string;
  livemode: boolean;
  error: string;
}) =>
  writeAccountStore((store) => {
    store.stripeEvents.push({
      id: input.stripeEventId,
      type: input.type,
      livemode: input.livemode,
      status: "failed",
      error: input.error,
      createdAt: nowIso(),
      processedAt: nowIso(),
    });
  });

export const recordStripeEventIgnored = async (input: {
  stripeEventId: string;
  type: string;
  livemode: boolean;
  error?: string;
}) =>
  writeAccountStore((store) => {
    if (store.stripeEvents.some((event) => event.id === input.stripeEventId)) return;
    store.stripeEvents.push({
      id: input.stripeEventId,
      type: input.type,
      livemode: input.livemode,
      status: "ignored",
      error: input.error,
      createdAt: nowIso(),
      processedAt: nowIso(),
    });
  });
