import { registrarSvc } from '@repo/axios-config';
import type { MouseEvent } from 'react';

function toRegistrarRelativePath(url: string): string {
  if (!url.startsWith('http')) {
    return url.replace(/^\//, '');
  }

  const parsed = new URL(url);
  const apiPrefix = '/api/';

  if (parsed.pathname.startsWith(apiPrefix)) {
    return parsed.pathname.slice(apiPrefix.length) + parsed.search;
  }

  return parsed.pathname.replace(/^\//, '') + parsed.search;
}

export async function downloadPrivateFile(
  url: string,
  fileName: string,
): Promise<void> {
  const response = await registrarSvc.get(toRegistrarRelativePath(url), {
    responseType: 'blob',
  });

  const blob =
    response.data instanceof Blob ? response.data : new Blob([response.data]);
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = objectUrl;
  anchor.download = fileName;
  anchor.rel = 'noopener';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(objectUrl);
}

export function handlePrivateFileDownloadClick(
  event: MouseEvent<HTMLAnchorElement>,
  url: string,
  fileName: string,
  expiresAt?: string | null,
  onError?: () => void,
): void {
  if (!expiresAt) {
    return;
  }

  event.preventDefault();
  void downloadPrivateFile(url, fileName).catch(() => {
    onError?.();
  });
}
