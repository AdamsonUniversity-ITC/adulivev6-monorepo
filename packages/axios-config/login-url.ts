import { env } from './env';

function authAppLoginBase(): string {
  const base = env.authApp.endsWith('/') ? env.authApp : `${env.authApp}/`;
  return new URL('login', base).toString();
}

export function buildLoginUrl(opts?: { returnTo?: string }) {
  const returnTo = opts?.returnTo ?? window.location.href;
  const url = new URL(authAppLoginBase());
  url.searchParams.set('returnTo', returnTo);
  return url.toString();
}

/** Login app URL with no returnTo — used after explicit logout. */
export function buildLogoutRedirectUrl() {
  const url = new URL(authAppLoginBase());
  url.searchParams.set('loggedOut', '1');
  return url.toString();
}
