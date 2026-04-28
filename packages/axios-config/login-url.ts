import { env } from './env';

export function buildLoginUrl(opts?: { returnTo?: string }) {
  const returnTo = opts?.returnTo ?? window.location.href;
  const base = env.authApp.endsWith('/') ? env.authApp : `${env.authApp}/`;
  const url = new URL('login', base);
  url.searchParams.set('returnTo', returnTo);
  return url.toString();
}

