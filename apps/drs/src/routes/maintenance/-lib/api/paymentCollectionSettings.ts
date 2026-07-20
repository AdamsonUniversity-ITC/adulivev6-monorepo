import { registrarSvc } from '@repo/axios-config/registrar-service';

export type PaymentCollectionPaymentMethod = {
  id: string;
  name: string;
  description: string | null;
};

export type PaymentCollectionOtherFee = {
  id: string;
  fee_name: string;
  amount: string;
};

export type PaymentCollectionSettings = {
  id: number | string;
  payment_methods: PaymentCollectionPaymentMethod[];
  other_fees: PaymentCollectionOtherFee[];
};

export type CreatePaymentCollectionPaymentMethodPayload = {
  name: string;
  description?: string | null;
};

export type CreatePaymentCollectionOtherFeePayload = {
  fee_name: string;
  amount: string;
};

const emptySettings: PaymentCollectionSettings = {
  id: '',
  payment_methods: [],
  other_fees: [],
};

const unwrap = (body: unknown): PaymentCollectionSettings | null => {
  if (!body || typeof body !== 'object') {
    return null;
  }

  const payload =
    'data' in body && body.data && typeof body.data === 'object'
      ? (body.data as Partial<PaymentCollectionSettings>)
      : (body as Partial<PaymentCollectionSettings>);

  return {
    id: payload.id ?? emptySettings.id,
    payment_methods: Array.isArray(payload.payment_methods)
      ? payload.payment_methods
      : [],
    other_fees: Array.isArray(payload.other_fees) ? payload.other_fees : [],
  };
};

export const fetchPaymentCollectionSettings =
  async (): Promise<PaymentCollectionSettings | null> => {
    const { data } = await registrarSvc.get<unknown>(
      `v1/drs/payment-collection-settings`,
    );

    return unwrap(data);
  };

export const createPaymentCollectionPaymentMethod = async (
  payload: CreatePaymentCollectionPaymentMethodPayload,
): Promise<void> => {
  await registrarSvc.post(
    `v1/drs/payment-collection-settings/payment-methods`,
    payload,
  );
};

export const deletePaymentCollectionPaymentMethod = async (
  paymentMethodId: string,
): Promise<void> => {
  await registrarSvc.delete(
    `v1/drs/payment-collection-settings/payment-methods/${encodeURIComponent(paymentMethodId)}`,
  );
};

export const createPaymentCollectionOtherFee = async (
  payload: CreatePaymentCollectionOtherFeePayload,
): Promise<void> => {
  await registrarSvc.post(
    `v1/drs/payment-collection-settings/other-fees`,
    payload,
  );
};

export const deletePaymentCollectionOtherFee = async (
  otherFeeId: string,
): Promise<void> => {
  await registrarSvc.delete(
    `v1/drs/payment-collection-settings/other-fees/${encodeURIComponent(otherFeeId)}`,
  );
};
