import { registrarSvc } from '@repo/axios-config/registrar-service';

export type ApplyDisclaimer = {
  body_html: string;
};

const unwrap = (response: unknown): ApplyDisclaimer => {
  if (
    response &&
    typeof response === 'object' &&
    'data' in response &&
    (response as { data?: unknown }).data &&
    typeof (response as { data: unknown }).data === 'object'
  ) {
    const data = (response as { data: { body_html?: unknown } }).data;
    return {
      body_html:
        typeof data.body_html === 'string' ? data.body_html : '',
    };
  }
  return { body_html: '' };
};

export const fetchApplyDisclaimer = async (): Promise<ApplyDisclaimer> => {
  const { data } = await registrarSvc.get('v1/drs/apply-disclaimer');
  return unwrap(data);
};

export const updateApplyDisclaimer = async (
  bodyHtml: string,
): Promise<ApplyDisclaimer> => {
  const { data } = await registrarSvc.patch('v1/drs/apply-disclaimer', {
    body_html: bodyHtml,
  });
  return unwrap(data);
};
