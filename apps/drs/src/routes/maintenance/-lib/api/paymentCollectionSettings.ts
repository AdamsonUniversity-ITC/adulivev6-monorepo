import { registrarSvc } from '@repo/axios-config/registrar-service';

export type PaymentCollectionBankAccount = {
  id: string;
  bank_name: string;
  account_number: string;
};

export type PaymentCollectionOtherFee = {
  id: string;
  fee_name: string;
  amount: string;
};

export type PaymentCollectionSettings = {
  id: number | string;
  bank_accounts: PaymentCollectionBankAccount[];
  other_fees: PaymentCollectionOtherFee[];
};

export type CreatePaymentCollectionBankAccountPayload = {
  bank_name: string;
  account_number: string;
};

export type CreatePaymentCollectionOtherFeePayload = {
  fee_name: string;
  amount: string;
};

const emptySettings: PaymentCollectionSettings = {
  id: '',
  bank_accounts: [],
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
    bank_accounts: Array.isArray(payload.bank_accounts)
      ? payload.bank_accounts
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

export const createPaymentCollectionBankAccount = async (
  payload: CreatePaymentCollectionBankAccountPayload,
): Promise<void> => {
  await registrarSvc.post(
    `v1/drs/payment-collection-settings/bank-accounts`,
    payload,
  );
};

export const deletePaymentCollectionBankAccount = async (
  bankAccountId: string,
): Promise<void> => {
  await registrarSvc.delete(
    `v1/drs/payment-collection-settings/bank-accounts/${encodeURIComponent(bankAccountId)}`,
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
