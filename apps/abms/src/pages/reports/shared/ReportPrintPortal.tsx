import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';

export function ReportPrintPortal({ children }: { children: ReactNode }) {
  return createPortal(
    <>
      {children}
      <style data-abms-report-page>{'@page { size: letter landscape; margin: 0.3in; }'}</style>
    </>,
    document.body,
  );
}
