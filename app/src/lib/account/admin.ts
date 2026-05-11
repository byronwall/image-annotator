import type { APIEvent } from "@solidjs/start/server";
import { getUserBySessionId, normalizeEmail } from "./store";
import { SESSION_COOKIE, parseCookies } from "./session";

export const DEFAULT_SUPER_USER_EMAIL = "owner@example.com";

export const getSuperUserEmail = () =>
  normalizeEmail(process.env.SUPER_USER_EMAIL || DEFAULT_SUPER_USER_EMAIL);

export const isSuperUserEmail = (email: string) =>
  normalizeEmail(email) === getSuperUserEmail();

export const requireSuperUser = async (event: APIEvent) => {
  const sessionId = parseCookies(event.request.headers.get("cookie")).get(SESSION_COOKIE);
  const user = await getUserBySessionId(sessionId);
  if (!user) {
    return {
      ok: false as const,
      response: Response.json({ error: "Sign in required." }, { status: 401 }),
    };
  }
  if (!isSuperUserEmail(user.email)) {
    return {
      ok: false as const,
      response: Response.json({ error: "Not authorized." }, { status: 403 }),
    };
  }
  return { ok: true as const, user: { ...user, isAdmin: true } };
};
