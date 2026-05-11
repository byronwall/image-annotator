import type { APIEvent } from "@solidjs/start/server";
import { isSuperUserEmail } from "./admin";
import {
  createSession,
  getAccountSnapshotForUser,
  getUserBySessionId,
  revokeSession,
  type AccountSnapshot,
  type LocalUserAccount,
} from "./store";

export const SESSION_COOKIE = "starter_session";

const isSecureCookie = () => process.env.APP_BASE_URL?.startsWith("https://") ?? false;

export const parseCookies = (cookieHeader: string | null) => {
  const cookies = new Map<string, string>();
  for (const part of cookieHeader?.split(";") ?? []) {
    const [name, ...valueParts] = part.trim().split("=");
    if (!name) continue;
    cookies.set(name, decodeURIComponent(valueParts.join("=")));
  }
  return cookies;
};

export const getSessionIdFromRequest = (request: Request) =>
  parseCookies(request.headers.get("cookie")).get(SESSION_COOKIE);

export const getCurrentUser = async (
  event: APIEvent,
): Promise<(LocalUserAccount & { isAdmin?: boolean }) | null> => {
  const user = await getUserBySessionId(getSessionIdFromRequest(event.request));
  return user ? { ...user, isAdmin: isSuperUserEmail(user.email) } : null;
};

export const getCurrentAccountSnapshot = async (
  event: APIEvent,
): Promise<AccountSnapshot> => getAccountSnapshotForUser(await getCurrentUser(event));

export const createSessionCookie = (sessionId: string) => {
  const parts = [
    `${SESSION_COOKIE}=${encodeURIComponent(sessionId)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    "Max-Age=2592000",
  ];
  if (isSecureCookie()) parts.push("Secure");
  return parts.join("; ");
};

export const clearSessionCookie = () =>
  [
    `${SESSION_COOKIE}=`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    "Max-Age=0",
    ...(isSecureCookie() ? ["Secure"] : []),
  ].join("; ");

export const createUserSessionCookie = async (userId: string) => {
  const session = await createSession(userId);
  return createSessionCookie(session.id);
};

export const revokeCurrentSession = async (event: APIEvent) => {
  const sessionId = getSessionIdFromRequest(event.request);
  if (sessionId) await revokeSession(sessionId);
};
