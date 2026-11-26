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

type LocationParts = Pick<Location, "protocol" | "hostname" | "port">;

/**
 * URL of the platform host (the "Your Boards" list), derived from the current
 * location by swapping the board label for `ticketing`. Protocol and port are
 * kept so it works in local dev (`itc-ts.localhost.test:5174` becomes
 * `ticketing.localhost.test:5174`). Hosts without a board label are returned
 * unchanged.
 */
export function platformUrl(
  path = "/",
  loc: LocationParts | undefined = typeof window !== "undefined"
    ? window.location
    : undefined,
): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  if (!loc) return normalizedPath;

  const hostname = loc.hostname.toLowerCase();
  const port = loc.port ? `:${loc.port}` : "";

  if (getBoardSubdomain(hostname) === "") {
    return `${loc.protocol}//${hostname}${port}${normalizedPath}`;
  }

  const rest = hostname.split(".").slice(1).join(".");
  const platformHost = rest ? `ticketing.${rest}` : hostname;
  return `${loc.protocol}//${platformHost}${port}${normalizedPath}`;
}
