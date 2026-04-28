import { registrarSvc } from '@repo/axios-config/registrar-service';

import type { CatalogGroup } from './types.ts';

export const fetchDocumentCatalog = async (): Promise<CatalogGroup[]> => {
  const { data } = await registrarSvc.get<unknown>('v1/drs/document-catalog');

  if (
    data &&
    typeof data === 'object' &&
    'data' in data &&
    Array.isArray(data.data)
  ) {
    return data.data as CatalogGroup[];
  }

  if (Array.isArray(data)) {
    return data as CatalogGroup[];
  }

  return [];
};
