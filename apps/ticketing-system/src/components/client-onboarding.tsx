import { useCallback, useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouterState } from "@tanstack/react-router";
import { HelpCircle } from "lucide-react";
import {
  EVENTS,
  Joyride,
  STATUS,
  type EventData,
  type Step,
} from "react-joyride";

import { completeOnboarding, fetchOnboarding } from "@/lib/aduts-api";
import { Button } from "@repo/ui/components/button";

const ALL_STEPS: Step[] = [
  {
    target: "body",
    placement: "center",
    title: "Welcome to the Ticketing System",
    content:
      "This short tour shows how to find an office, file a request, and follow it.",
  },
  {
    target: '[data-tour="sidebar-home"]',
    title: "Home",
    content:
      "Home is where you start. On the platform it lists offices. Inside an office it lists tickets.",
  },
  {
    target: '[data-tour="header-search"]',
    title: "Search",
    content:
      "Search tickets and people from here, or press Ctrl+K (⌘K on a Mac).",
  },
  {
    target: '[data-tour="boards-list"]',
    title: "Your offices",
    content:
      "Each card is an office. Open the office you need help from.",
  },
  {
    target: '[data-tour="my-tickets"]',
    title: "Your tickets",
    content:
      "See requests you filed across every office you can open.",
  },
  {
    target: '[data-tour="new-ticket"]',
    title: "File a request",
    content:
      "New Ticket opens a form for this office. Choose a section, write a title, and describe the problem.",
  },
  {
    target: '[data-tour="status-tabs"]',
    title: "Filter by status",
    content:
      "Narrow the list to Open, In Progress, Resolved, and other statuses.",
  },
  {
    target: '[data-tour="ticket-table"]',
    title: "The ticket list",
    content:
      "Click a row to open the conversation, attach files, and follow progress.",
  },
];

function stepsInDom(steps: Step[]): Step[] {
  return steps.filter((step) => {
    if (typeof step.target !== "string") {
      return false;
    }
    if (step.target === "body") {
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

  const statusQuery = useQuery({
    queryKey: ["aduts", "onboarding"],
    queryFn: fetchOnboarding,
  });

  const completeMutation = useMutation({
    mutationFn: completeOnboarding,
    onSuccess: (data) => {
      queryClient.setQueryData(["aduts", "onboarding"], data);
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
    if (!statusQuery.isSuccess || statusQuery.data.completed || autoStarted.current) {
      return;
    }

    const id = window.setTimeout(() => {
      if (startTour(false)) {
        autoStarted.current = true;
      }
    }, 400);

    return () => window.clearTimeout(id);
  }, [pathname, startTour, statusQuery.data?.completed, statusQuery.isSuccess]);

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
        locale={{ last: "Finish", skip: "Skip" }}
        options={{
          skipBeacon: true,
          showProgress: true,
          overlayClickAction: false,
          buttons: ["back", "skip", "primary"],
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
