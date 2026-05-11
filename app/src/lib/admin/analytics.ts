import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, stat, writeFile } from "node:fs/promises";
import path from "node:path";

export type AnalyticsRequestRecord = {
  id: string;
  startedAt: string;
  completedAt: string;
  method: string;
  path: string;
  query: string;
  status: number;
  durationMs: number;
  requestBytes: number;
  responseBytes: number;
  userId?: string;
  userEmail?: string;
  ip?: string;
  userAgent?: string;
  referer?: string;
  contentType?: string;
  responseContentType?: string;
};

export type AnalyticsMetric = {
  label: string;
  value: number;
  requestBytes: number;
  responseBytes: number;
  averageDurationMs: number;
  errorCount: number;
};

export type AnalyticsSnapshot = {
  generatedAt: string;
  retainedRequestCount: number;
  firstRequestAt?: string;
  lastRequestAt?: string;
  totals: {
    requests: number;
    success: number;
    redirects: number;
    clientErrors: number;
    serverErrors: number;
    requestBytes: number;
    responseBytes: number;
    averageDurationMs: number;
    uniqueIps: number;
  };
  lastHour: AnalyticsSnapshot["totals"];
  topPaths: AnalyticsMetric[];
  topUsers: AnalyticsMetric[];
  topUserAgents: AnalyticsMetric[];
  topReferers: AnalyticsMetric[];
  statusGroups: AnalyticsMetric[];
  recentRequests: AnalyticsRequestRecord[];
};

type AnalyticsStore = {
  schemaVersion: 1;
  requests: AnalyticsRequestRecord[];
};

const maxRetainedRequests = 10_000;
let analyticsWriteQueue = Promise.resolve();

const getWorkspaceRoot = () => {
  const cwd = process.cwd();
  return path.basename(cwd) === "app" ? path.dirname(cwd) : cwd;
};

const getRuntimeDataDir = () => {
  const configured = process.env.APP_DATA_DIR?.trim();
  if (!configured) return path.join(getWorkspaceRoot(), "app/data");
  return path.isAbsolute(configured)
    ? configured
    : path.join(getWorkspaceRoot(), configured);
};

const getStorePath = () => path.join(getRuntimeDataDir(), "analytics/store.json");

const fileExists = async (filePath: string) => {
  try {
    await stat(filePath);
    return true;
  } catch {
    return false;
  }
};

const emptyStore = (): AnalyticsStore => ({ schemaVersion: 1, requests: [] });

const readStore = async (): Promise<AnalyticsStore> => {
  const storePath = getStorePath();
  if (!(await fileExists(storePath))) return emptyStore();
  const parsed = JSON.parse(await readFile(storePath, "utf8")) as Partial<AnalyticsStore>;
  return {
    schemaVersion: 1,
    requests: Array.isArray(parsed.requests) ? parsed.requests : [],
  };
};

const writeStore = async (store: AnalyticsStore) => {
  const storePath = getStorePath();
  await mkdir(path.dirname(storePath), { recursive: true });
  const tempPath = `${storePath}.${process.pid}.${randomUUID()}.tmp`;
  await writeFile(tempPath, `${JSON.stringify(store, null, 2)}\n`, "utf8");
  await rename(tempPath, storePath);
};

export const shouldTrackAnalyticsPath = (pathName: string) =>
  !pathName.startsWith("/_build/") &&
  !pathName.startsWith("/favicon") &&
  !pathName.startsWith("/apple-touch-icon") &&
  !pathName.startsWith("/site.webmanifest") &&
  pathName !== "/api/admin/analytics";

export const logAnalyticsRequest = (record: Omit<AnalyticsRequestRecord, "id">) => {
  analyticsWriteQueue = analyticsWriteQueue
    .then(async () => {
      const store = await readStore();
      store.requests.push({ id: randomUUID(), ...record });
      if (store.requests.length > maxRetainedRequests) {
        store.requests = store.requests.slice(-maxRetainedRequests);
      }
      await writeStore(store);
    })
    .catch((error) => {
      console.error("[analytics] request log failed", error);
    });
};

const emptyTotals = (): AnalyticsSnapshot["totals"] => ({
  requests: 0,
  success: 0,
  redirects: 0,
  clientErrors: 0,
  serverErrors: 0,
  requestBytes: 0,
  responseBytes: 0,
  averageDurationMs: 0,
  uniqueIps: 0,
});

const summarizeTotals = (records: AnalyticsRequestRecord[]) => {
  const totals = emptyTotals();
  const ips = new Set<string>();
  let durationTotal = 0;
  for (const record of records) {
    totals.requests += 1;
    totals.requestBytes += record.requestBytes;
    totals.responseBytes += record.responseBytes;
    durationTotal += record.durationMs;
    if (record.ip) ips.add(record.ip);
    if (record.status >= 500) totals.serverErrors += 1;
    else if (record.status >= 400) totals.clientErrors += 1;
    else if (record.status >= 300) totals.redirects += 1;
    else totals.success += 1;
  }
  totals.uniqueIps = ips.size;
  totals.averageDurationMs = records.length ? Math.round(durationTotal / records.length) : 0;
  return totals;
};

const groupRecords = (
  records: AnalyticsRequestRecord[],
  getLabel: (record: AnalyticsRequestRecord) => string,
  limit: number,
) =>
  Array.from(
    records.reduce((groups, record) => {
      const label = getLabel(record) || "Direct / unknown";
      const metric =
        groups.get(label) ??
        ({
          label,
          value: 0,
          requestBytes: 0,
          responseBytes: 0,
          averageDurationMs: 0,
          errorCount: 0,
          durationTotal: 0,
        } as AnalyticsMetric & { durationTotal: number });
      metric.value += 1;
      metric.requestBytes += record.requestBytes;
      metric.responseBytes += record.responseBytes;
      metric.durationTotal += record.durationMs;
      if (record.status >= 400) metric.errorCount += 1;
      groups.set(label, metric);
      return groups;
    }, new Map<string, AnalyticsMetric & { durationTotal: number }>()),
  )
    .map(([, metric]) => metric)
    .map(({ durationTotal, ...metric }) => ({
      ...metric,
      averageDurationMs: metric.value ? Math.round(durationTotal / metric.value) : 0,
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, limit);

export const getAnalyticsSnapshot = async (): Promise<AnalyticsSnapshot> => {
  const store = await readStore();
  const records = [...store.requests].sort((a, b) =>
    a.startedAt.localeCompare(b.startedAt),
  );
  const oneHourAgo = Date.now() - 60 * 60 * 1000;
  const lastHourRecords = records.filter(
    (record) => new Date(record.startedAt).getTime() >= oneHourAgo,
  );

  return {
    generatedAt: new Date().toISOString(),
    retainedRequestCount: records.length,
    firstRequestAt: records[0]?.startedAt,
    lastRequestAt: records.at(-1)?.startedAt,
    totals: summarizeTotals(records),
    lastHour: summarizeTotals(lastHourRecords),
    topPaths: groupRecords(records, (record) => `${record.method} ${record.path}`, 12),
    topUserAgents: groupRecords(records, (record) => record.userAgent ?? "", 8),
    topReferers: groupRecords(records, (record) => record.referer ?? "", 8),
    statusGroups: groupRecords(records, (record) => `${Math.floor(record.status / 100)}xx`, 6),
    topUsers: groupRecords(records, (record) => record.userEmail ?? "Anonymous", 12),
    recentRequests: records.slice(-100).reverse(),
  };
};
