import * as React from 'react';

import { authSvc, env } from '@repo/axios-config';
import { Button } from '@repo/ui/components/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@repo/ui/components/card';
import { Input } from '@repo/ui/components/input';
import { Label } from '@repo/ui/components/label';

async function ensureAuthCsrfCookie() {
  const apiBase = env.authService.endsWith('/api/')
    ? env.authService.slice(0, -'/api/'.length)
    : env.authService.replace(/\/api\/?$/, '');
  const url = `${apiBase}/sanctum/csrf-cookie`;
  await fetch(url, { credentials: 'include' });
}

function getReturnTo() {
  const params = new URLSearchParams(window.location.search);
  const returnTo = params.get('returnTo');
  return returnTo && returnTo.trim().length > 0 ? returnTo : env.aduLive;
}

const App = () => {
  const [returnTo] = React.useState(() => getReturnTo());
  const [username, setUsername] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isChecking, setIsChecking] = React.useState(false);

  // React.useEffect(() => {
  //   let cancelled = false;
  //   (async () => {
  //     try {
  //       await ensureAuthCsrfCookie();
  //       await authSvc.get('user');
  //       if (!cancelled) window.location.assign(returnTo);
  //     } catch {
  //       // Not logged in; show login form.
  //     } finally {
  //       if (!cancelled) setIsChecking(false);
  //     }
  //   })();
  //   return () => {
  //     cancelled = true;
  //   };
  // }, [returnTo]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setError(null);
    setIsSubmitting(true);
    try {
      await ensureAuthCsrfCookie();
      await authSvc.post('token/login', {
        idno: username,
        password,
      });
      window.location.assign(returnTo);
    } catch (err: unknown) {
      const message =
        typeof err === 'object' && err && 'response' in err
          ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ((err as any).response?.data?.message as string | undefined)
          : undefined;
      setError(message ?? 'Invalid credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-background text-foreground flex min-h-screen items-center justify-center px-4 py-10">
      <Card className="border-border/80 w-full max-w-md shadow-sm">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl">Sign in</CardTitle>
          <CardDescription className="wrap-break-word">
            You’ll be returned to{' '}
            <span className="font-medium">{returnTo}</span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isChecking ? (
            <div className="text-muted-foreground text-sm">
              Checking session…
            </div>
          ) : (
            <form className="space-y-4" onSubmit={onSubmit}>
              <div className="space-y-2">
                <Label htmlFor="auth-username">Username</Label>
                <Input
                  id="auth-username"
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="auth-password">Password</Label>
                <Input
                  id="auth-password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              {error ? (
                <p className="text-destructive text-sm">{error}</p>
              ) : null}

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? 'Signing in…' : 'Sign in'}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default App;
