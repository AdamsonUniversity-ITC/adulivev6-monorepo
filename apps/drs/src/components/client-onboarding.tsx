import { DRS_STUDENT_APPLY_PERMISSION } from '@/lib/drsPermissions.ts';
import {
  DRS_AUTH_USER_QUERY_KEY,
  fetchAuthUser,
  normalizePermissions,
} from '@/lib/fetchAuthUser.ts';
import { completeOnboarding, fetchOnboarding } from '@/lib/onboarding.ts';
import { checkPermission } from '@repo/hooks';
import { Button } from '@repo/ui/components/button';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouterState } from '@tanstack/react-router';
import { HelpCircle } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  EVENTS,
  Joyride,
  STATUS,
  type EventData,
  type Step,
} from 'react-joyride';

const ALL_STEPS: Step[] = [
  {
    target: 'body',
    placement: 'center',
    title: 'Welcome to Document Requests',
    content:
      'This short tour shows how to request a document from the registrar.',
  },
  {
    target: '[data-tour="nav-apply"]',
    title: 'Request a document',
    content:
      'Open Request a document to pick what you need and send it to the registrar.',
  },
  {
    target: '[data-tour="apply-catalog"]',
    title: 'Choose documents',
    content:
      'Browse the catalog, add copies of documents or packages, and filter by name if the list is long.',
  },
  {
    target: '[data-tour="apply-submit"]',
    title: 'Review and submit',
    content:
      'When your selection looks right, review the request and submit it to the registrar.',
  },
];

function stepsInDom(steps: Step[]): Step[] {
  return steps.filter((step) => {
    if (typeof step.target !== 'string') {
      return false;
    }
    if (step.target === 'body') {
      return true;
    }
    return document.querySelector(step.target) !== null;
  });
}

export function ClientOnboarding() {
  const queryClient = useQueryClient();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [run, setRun] = useState(false);
  const [steps, setSteps] = useState<Step[]>([]);
  const autoStarted = useRef(false);
  const replayRef = useRef(false);

  const authQuery = useQuery({
    queryKey: DRS_AUTH_USER_QUERY_KEY,
    queryFn: async () => (await fetchAuthUser()).data,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  const permissions = normalizePermissions(authQuery.data ?? { id: 0 });
  const isStudent = checkPermission(permissions, DRS_STUDENT_APPLY_PERMISSION);

  const statusQuery = useQuery({
    queryKey: ['drs', 'onboarding'],
    queryFn: fetchOnboarding,
    enabled: authQuery.isSuccess && isStudent,
  });

  const completeMutation = useMutation({
    mutationFn: completeOnboarding,
    onSuccess: (data) => {
      queryClient.setQueryData(['drs', 'onboarding'], data);
    },
  });

  const startTour = useCallback((isReplay: boolean) => {
    const next = stepsInDom(ALL_STEPS);
    if (next.length === 0) {
      return false;
    }
    setSteps(next);
    replayRef.current = isReplay;
    setRun(true);
    return true;
  }, []);

  useEffect(() => {
    if (
      !isStudent ||
      !statusQuery.isSuccess ||
      statusQuery.data.completed ||
      autoStarted.current
    ) {
      return;
    }

    const id = window.setTimeout(() => {
      if (startTour(false)) {
        autoStarted.current = true;
      }
    }, 400);

    return () => window.clearTimeout(id);
  }, [
    isStudent,
    pathname,
    startTour,
    statusQuery.data?.completed,
    statusQuery.isSuccess,
  ]);

  function handleEvent(data: EventData) {
    if (data.type !== EVENTS.TOUR_END) {
      return;
    }

    setRun(false);

    if (replayRef.current) {
      replayRef.current = false;
      return;
    }

    if (data.status === STATUS.FINISHED || data.status === STATUS.SKIPPED) {
      completeMutation.mutate();
    }
  }

  if (!isStudent) {
    return null;
  }

  const completed = statusQuery.data?.completed === true;
  const showReplay = completed && !run;

  return (
    <>
      <Joyride
        steps={steps}
        run={run}
        continuous
        scrollToFirstStep
        onEvent={handleEvent}
        locale={{ last: 'Finish', skip: 'Skip' }}
        options={{
          skipBeacon: true,
          showProgress: true,
          overlayClickAction: false,
          buttons: ['back', 'skip', 'primary'],
          zIndex: 80,
        }}
      />
      {showReplay ? (
        <Button
          type="button"
          size="icon"
          className="fixed right-6 bottom-6 z-50 size-12 rounded-full shadow-md"
          aria-label="Show quick tour"
          title="Show quick tour"
          onClick={() => startTour(true)}
        >
          <HelpCircle className="size-5" />
        </Button>
      ) : null}
    </>
  );
}
