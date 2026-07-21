import { env } from './env';
import { buildLoginUrl } from './login-url';

let loginAppReachable: boolean | null = null;

async function isLoginAppReachable(): Promise<boolean> {
  if (loginAppReachable !== null) {
    return loginAppReachable;
  }

  if (!import.meta.env.DEV) {
    loginAppReachable = true;
    return loginAppReachable;
  }

  try {
    const base = env.authApp.endsWith('/') ? env.authApp : `${env.authApp}/`;
    await fetch(base, { method: 'HEAD', signal: AbortSignal.timeout(1500) });
    loginAppReachable = true;
  } catch {
    loginAppReachable = false;
  }

  return loginAppReachable;
}

export async function redirectOnUnauthorized(returnTo?: string): Promise<void> {
  if (await isLoginAppReachable()) {
    window.location.assign(buildLoginUrl(returnTo ? { returnTo } : undefined));
    return;
  }

  if (import.meta.env.DEV) {
    console.warn(
      '[auth] Session missing or expired, but the login app is not reachable. Start the auth frontend or sign in via the API before using DRS.',
    );
  }
}
