import { env } from './env';
import { buildLoginUrl } from './login-url';

let loginAppReachable: boolean | null = null;

/** Vite/Node inject NODE_ENV; avoid import.meta (TS1470 under NodeNext/CJS). */
function isDev(): boolean {
  return (
    typeof process !== 'undefined' && process.env.NODE_ENV !== 'production'
  );
}

async function isLoginAppReachable(): Promise<boolean> {
  if (loginAppReachable !== null) {
    return loginAppReachable;
  }

  if (!isDev()) {
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

  if (isDev()) {
    console.warn(
      '[auth] Session missing or expired, but the login app is not reachable. Start the auth frontend or sign in via the API before using DRS.',
    );
  }
}
