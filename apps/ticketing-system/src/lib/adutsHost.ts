/**
 * Exact host label for board tenancy.
 * Platform host `ticketing.localhost.test` → empty string.
 * Board host `itc-ts.localhost.test` → `itc-ts`.
 */
export function getBoardSubdomain(hostname: string): string {
  const normalized = hostname.toLowerCase().trim();
  const parts = normalized.split(".");

  if (
    normalized === "ticketing.localhost.test" ||
    normalized === "localhost.test" ||
    normalized === "localhost" ||
    normalized === "127.0.0.1"
  ) {
    return "";
  }

  const first = parts[0] ?? "";
  if (first === "ticketing" || first === "www" || first === "aduts") {
    return "";
  }

  return first;
}

export function isPlatformHost(
  hostname: string = typeof window !== "undefined"
    ? window.location.hostname
    : "",
): boolean {
  return getBoardSubdomain(hostname) === "";
}

export function boardUrl(
  slug: string,
  path = "/",
  baseDomain = "localhost.test",
): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `http://${slug}.${baseDomain}${normalizedPath}`;
}
