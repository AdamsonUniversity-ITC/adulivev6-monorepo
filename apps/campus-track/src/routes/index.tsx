import { Avatar, AvatarFallback, AvatarImage } from '@repo/ui/components/avatar';
import { Badge } from '@repo/ui/components/badge';
import { Card, CardContent } from '@repo/ui/components/card';
import { Separator } from '@repo/ui/components/separator';
import { createFileRoute } from '@tanstack/react-router';
import { CheckCircle2, Clock3, Radio, ShieldCheck } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';

export const Route = createFileRoute('/')({ component: CampusTrackDisplay });

type DisplayTap = {
  event_id: string;
  name: string;
  student_number: string | null;
  program: string | null;
  avatar_url: string | null;
  occurred_at: string | null;
};

type DisplayResponse = {
  tap: DisplayTap | null;
};

const POLL_MS = 2000;

function formatTapTime(iso: string | null | undefined): string {
  if (!iso) {
    return '—';
  }
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    return '—';
  }
  return new Intl.DateTimeFormat('en-PH', {
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  }).format(d);
}

function CampusTrackDisplay() {
  const [now, setNow] = useState(() => new Date());
  const [tap, setTap] = useState<DisplayTap | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [initialLoad, setInitialLoad] = useState(true);

  const registrarBase = (import.meta.env.VITE_REGISTRAR_API_URL as string | undefined)?.replace(
    /\/$/,
    '',
  );
  const displayToken = import.meta.env.VITE_REGISTRAR_DISPLAY_TOKEN as string | undefined;

  const fetchLatest = useCallback(async () => {
    if (!registrarBase) {
      setFetchError('VITE_REGISTRAR_API_URL is not set.');
      setInitialLoad(false);
      return;
    }

    const headers: HeadersInit = { Accept: 'application/json' };
    if (displayToken) {
      headers.Authorization = `Bearer ${displayToken}`;
    }

    try {
      const res = await fetch(`${registrarBase}/api/v1/campus-track/display/latest`, {
        headers,
      });
      if (!res.ok) {
        setFetchError(`Display API error (${res.status})`);
        setInitialLoad(false);
        return;
      }
      const body = (await res.json()) as DisplayResponse;
      setTap(body.tap);
      setFetchError(null);
    } catch {
      setFetchError('Unable to reach registrar API.');
    } finally {
      setInitialLoad(false);
    }
  }, [registrarBase, displayToken]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    void fetchLatest();
    const id = window.setInterval(() => void fetchLatest(), POLL_MS);
    return () => window.clearInterval(id);
  }, [fetchLatest]);

  const time = useMemo(
    () =>
      new Intl.DateTimeFormat('en-PH', {
        hour: 'numeric',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      }).format(now),
    [now],
  );

  const date = useMemo(
    () =>
      new Intl.DateTimeFormat('en-PH', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      }).format(now),
    [now],
  );

  const displayName = tap?.name ?? 'Waiting for tap-in…';
  const studentNumber = tap?.student_number ?? '—';
  const program = tap?.program ?? '—';
  const tapTimeLabel = formatTapTime(tap?.occurred_at ?? null);

  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const hasTap = Boolean(tap);

  return (
    <main className="min-h-screen bg-[#f5f7fb] text-slate-950">
      <section className="flex min-h-screen flex-col gap-4 p-3 sm:p-4 lg:p-5">
        {fetchError ? (
          <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-900">
            {fetchError}
          </p>
        ) : null}
        <header className="flex shrink-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold tracking-[0.18em] text-blue-700 uppercase">
              Campus Track
            </p>
            <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">
              Attendance Tap Display
            </h1>
          </div>
          <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <Clock3 className="size-5 text-blue-700" />
            <div>
              <p className="text-4xl font-semibold tabular-nums">{time}</p>
              <p className="text-sm text-slate-500">{date}</p>
            </div>
          </div>
        </header>

        <div className="grid min-h-0 flex-1">
          <Card className="h-full w-full overflow-hidden rounded-lg border-slate-200 bg-white py-0 shadow-xl">
            <CardContent className="grid h-full gap-0 p-0 lg:grid-cols-[minmax(360px,0.95fr)_1.05fr]">
              <div className="flex min-h-[38rem] flex-col justify-between bg-slate-950 p-6 text-white sm:p-8 lg:min-h-0 lg:p-10">
                <div className="flex items-center justify-between gap-4">
                  <Badge
                    className={
                      hasTap
                        ? 'w-fit bg-emerald-500 text-white hover:bg-emerald-500'
                        : 'w-fit bg-slate-600 text-white hover:bg-slate-600'
                    }
                  >
                    <CheckCircle2 className="mr-1 size-3.5" />
                    {initialLoad ? 'Loading…' : hasTap ? 'Tap verified' : 'No tap yet'}
                  </Badge>
                  <Radio className="size-7 text-emerald-300" />
                </div>

                <div className="grid flex-1 place-items-center py-6">
                  <Avatar className="size-[min(52vh,22rem)] border-4 border-white/20 shadow-2xl">
                    <AvatarImage src={tap?.avatar_url ?? undefined} alt={displayName} />
                    <AvatarFallback className="bg-blue-700 text-5xl font-semibold text-white">
                      {initials || '—'}
                    </AvatarFallback>
                  </Avatar>
                </div>

                <div />
              </div>

              <div className="flex min-h-0 flex-col justify-center p-6 sm:p-8 lg:p-12">
                <div className="mb-6 flex items-center gap-3">
                  <div className="grid size-12 place-items-center rounded-full bg-blue-100 text-blue-700">
                    <ShieldCheck className="size-6" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-500">Latest student tap</p>
                    <p className="text-lg font-semibold text-emerald-700">
                      {hasTap ? 'Entry recorded' : 'Awaiting attendance'}
                    </p>
                  </div>
                </div>

                <h2 className="text-5xl leading-tight font-bold tracking-tight text-balance sm:text-7xl xl:text-8xl">
                  {displayName}
                </h2>
                <p className="mt-5 text-3xl font-medium text-slate-600 xl:text-4xl">{studentNumber}</p>

                <Separator className="my-7" />

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-5">
                    <p className="text-sm font-medium text-slate-500">Program</p>
                    <p className="mt-2 text-2xl font-semibold">{program}</p>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-5">
                    <p className="text-sm font-medium text-slate-500">Tap time</p>
                    <p className="mt-2 text-2xl font-semibold tabular-nums">{tapTimeLabel}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  );
}
