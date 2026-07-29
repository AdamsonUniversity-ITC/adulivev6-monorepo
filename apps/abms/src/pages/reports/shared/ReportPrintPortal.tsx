import { useEffect, useId, useMemo, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { ReportExcelButton } from './ReportExcelButton';

function ReportExcelAction() {
  const hostId = useId();
  const host = useMemo(() => {
    const element = document.createElement('span');
    element.dataset.reportExcelHost = hostId;
    element.style.display = 'contents';

    return element;
  }, [hostId]);

  useEffect(() => {
    const dialogs = Array.from(document.querySelectorAll<HTMLElement>('[role="dialog"]')).reverse();
    const dialog = dialogs.find(candidate =>
      candidate.querySelector('article')
      && candidate.querySelector('.report-actions, .report-preview-actions')
    );
    const actions = dialog?.querySelector<HTMLElement>('.report-actions, .report-preview-actions');
    if (!actions) return;

    const printButton = Array.from(actions.querySelectorAll('button'))
      .find(button => button.textContent?.trim().toLowerCase() === 'print');
    actions.insertBefore(host, printButton ?? null);

    return () => {
      host.remove();
    };
  }, [host, hostId]);

  return createPortal(<ReportExcelButton />, host);
}

export function ReportPrintPortal({ children }: { children: ReactNode }) {
  return createPortal(
    <>
      {children}
      <ReportExcelAction />
      <style data-abms-report-page>{'@page { size: letter landscape; margin: 0.3in; }'}</style>
    </>,
    document.body,
  );
}
