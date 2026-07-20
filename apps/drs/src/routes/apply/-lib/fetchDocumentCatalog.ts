import { registrarSvc } from '@repo/axios-config/registrar-service';

import type { CatalogGroup } from './types.ts';

export type CatalogEligibilityMeta = {
  is_enrolled: boolean;
  is_undergraduate: boolean;
  is_graduate: boolean;
};

export type DocumentCatalogResult = {
  groups: CatalogGroup[];
  eligibility: CatalogEligibilityMeta | null;
};

export const fetchDocumentCatalog =
  async (): Promise<DocumentCatalogResult> => {
    const { data } = await registrarSvc.get<{
      data?: CatalogGroup[];
      meta?: { eligibility?: CatalogEligibilityMeta | null };
    }>('v1/drs/document-catalog');

    if (data && typeof data === 'object' && Array.isArray(data.data)) {
      return {
        groups: data.data,
        eligibility: data.meta?.eligibility ?? null,
      };
    }

    if (Array.isArray(data)) {
      return { groups: data as CatalogGroup[], eligibility: null };
    }

    return { groups: [], eligibility: null };
  };
