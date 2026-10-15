import { getDrSubdomain } from './drsPermissions.ts';

const TENANT_LABEL: Record<string, string> = {
  'college-drs': 'College',
  'shs-drs': 'Senior High School',
  'bed-drs': 'Basic Education',
};

export function drsTenantLabel(hostname: string): string | null {
  return TENANT_LABEL[getDrSubdomain(hostname)] ?? null;
}

export function drsDocumentTitle(hostname: string): string {
  const label = drsTenantLabel(hostname);
  return label ? `DRS - ${label}` : 'DRS';
}
