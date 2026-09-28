import { registrarSvc } from '@repo/axios-config/registrar-service';

import type { StudentBalanceMeta } from './studentBalanceLabel.ts';
import type { CatalogGroup } from './types.ts';

export type CatalogEligibilityMeta = {
  is_enrolled: boolean;
  is_undergraduate: boolean;
  is_graduate: boolean;
};

export type DocumentCatalogResult = {
  groups: CatalogGroup[];
  eligibility: CatalogEligibilityMeta | null;
  studentBalance: StudentBalanceMeta | null;
  applyDisclaimerHtml: string;
};

export const fetchDocumentCatalog =
  async (): Promise<DocumentCatalogResult> => {
    const { data } = await registrarSvc.get<{
      data?: CatalogGroup[];
      meta?: {
        eligibility?: CatalogEligibilityMeta | null;
        student_balance?: StudentBalanceMeta | null;
        apply_disclaimer_html?: string | null;
      };
    }>('v1/drs/document-catalog');

    if (data && typeof data === 'object' && Array.isArray(data.data)) {
      return {
        groups: data.data,
        eligibility: data.meta?.eligibility ?? null,
        studentBalance: data.meta?.student_balance ?? null,
        applyDisclaimerHtml:
          typeof data.meta?.apply_disclaimer_html === 'string'
            ? data.meta.apply_disclaimer_html
            : '',
      };
    }

    if (Array.isArray(data)) {
      return {
        groups: data as CatalogGroup[],
        eligibility: null,
        studentBalance: null,
        applyDisclaimerHtml: '',
      };
    }

    return {
      groups: [],
      eligibility: null,
      studentBalance: null,
      applyDisclaimerHtml: '',
    };
  };
