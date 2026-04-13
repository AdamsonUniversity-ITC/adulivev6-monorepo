import { registrarSvc } from '@repo/axios-config/registrar-service';

export const fetchDocument = async (documentId: string) => {
  const { data } = await registrarSvc.get(`v1/drs/documents/${documentId}`, {
    params: {
      with: 'rules.rule',
    },
  });
  return data;
};
