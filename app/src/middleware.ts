import { defineMiddleware } from "vinxi/http";
import { SESSION_COOKIE, parseCookies } from "~/lib/account/session";
import { getUserBySessionId } from "~/lib/account/store";
import { logAnalyticsRequest, shouldTrackAnalyticsPath } from "~/lib/admin/analytics";

const analyticsContextKey = "analyticsStartedAt";

const parseByteLength = (value: string | null | undefined) => {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
};

const getIp = (headers: Record<string, string | string[] | undefined>) => {
  const forwardedFor = headers["x-forwarded-for"];
  const realIp = headers["x-real-ip"];
  return (
    (Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor)
      ?.split(",")[0]
      ?.trim() ||
    (Array.isArray(realIp) ? realIp[0] : realIp) ||
    undefined
  );
};

const getResponseStatus = (eventStatus: number | undefined, body: unknown) => {
  if (body instanceof Response) return body.status;
  return eventStatus && eventStatus >= 100 ? eventStatus : 200;
};

const getResponseHeader = (body: unknown, key: string) =>
  body instanceof Response ? body.headers.get(key) : undefined;

const getAnalyticsUser = async (cookieHeader: string | undefined) => {
  const sessionId = parseCookies(cookieHeader ?? null).get(SESSION_COOKIE);
  const user = await getUserBySessionId(sessionId);
  return user ? { userId: user.id, userEmail: user.email } : {};
};

export default defineMiddleware({
  onRequest: (event) => {
    event.context[analyticsContextKey] = Date.now();
  },
  onBeforeResponse: async (event, response) => {
    const startedAtMs =
      typeof event.context[analyticsContextKey] === "number"
        ? event.context[analyticsContextKey]
        : Date.now();
    const requestUrl = new URL(event.node.req.url ?? "/", "http://localhost");
    if (!shouldTrackAnalyticsPath(requestUrl.pathname)) return;

    const completedAtMs = Date.now();
    const body = response.body;
    const user = await getAnalyticsUser(event.node.req.headers.cookie);
    const responseContentLength = getResponseHeader(body, "content-length");
    const responseContentType =
      getResponseHeader(body, "content-type") ||
      event.node.res.getHeader("content-type")?.toString();

    logAnalyticsRequest({
      startedAt: new Date(startedAtMs).toISOString(),
      completedAt: new Date(completedAtMs).toISOString(),
      method: event.node.req.method ?? "GET",
      path: requestUrl.pathname,
      query: requestUrl.search,
      status: getResponseStatus(event.node.res.statusCode, body),
      durationMs: completedAtMs - startedAtMs,
      requestBytes: parseByteLength(event.node.req.headers["content-length"]?.toString()),
      responseBytes: parseByteLength(
        responseContentLength ?? event.node.res.getHeader("content-length")?.toString(),
      ),
      ...user,
      ip: getIp(event.node.req.headers),
      userAgent: event.node.req.headers["user-agent"]?.toString(),
      referer: event.node.req.headers.referer?.toString(),
      contentType: event.node.req.headers["content-type"]?.toString(),
      responseContentType,
    });
  },
});
