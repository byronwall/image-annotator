export function normalizeActionUrl(url: string) {
  return url.startsWith("//_server") ? url.slice(1) : url;
}
