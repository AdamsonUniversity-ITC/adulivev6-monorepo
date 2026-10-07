import { registrarSvc } from '@repo/axios-config/registrar-service';

import type { ApplyRequestFormValues } from '../applyRequestSchema.ts';

export type ApplyRequestLine = {
  requestable_type: 'document' | 'package';
  requestable_id: number;
  quantity: number;
  option_answers?: Array<{ option_id: number; value: string }>;
};

export type ApplyCartLine = {
  clientId: string;
  catalogKey: string;
  quantity: number;
};

export type ApplySupportingUpload = {
  requestable_type: 'document';
  requestable_id: number;
  requirement_id: number;
  temp_upload_ids: number[];
};

export type ApplyRequestPayload = {
  email: string;
  contact_number: string;
  receive_mode: string;
  payment_method_id: number;
  secure_email_requested: boolean;
  delivery_address: string | null;
  purpose: string | null;
  lines: ApplyRequestLine[];
  supporting_uploads?: ApplySupportingUpload[];
};

export function createApplyCartClientId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `line-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function lineFromCatalogKey(
  key: string,
  quantity: number,
): ApplyRequestLine | null {
  if (key.startsWith('d:')) {
    const requestable_id = Number(key.slice(2));
    if (!Number.isFinite(requestable_id) || requestable_id < 1) {
      return null;
    }
    return {
      requestable_type: 'document',
      requestable_id,
      quantity,
    };
  }
  if (key.startsWith('p:')) {
    const requestable_id = Number(key.slice(2));
    if (!Number.isFinite(requestable_id) || requestable_id < 1) {
      return null;
    }
    return {
      requestable_type: 'package',
      requestable_id,
      quantity,
    };
  }
  return null;
}

export type ValidateApplyLineQuantitiesResult =
  | { ok: true; lines: ApplyRequestLine[]; cartLines: ApplyCartLine[] }
  | { ok: false; message: string };

export function totalQtyForCatalogKey(
  cartLines: ApplyCartLine[],
  catalogKey: string,
): number {
  return cartLines.reduce(
    (sum, line) =>
      line.catalogKey === catalogKey && line.quantity > 0
        ? sum + line.quantity
        : sum,
    0,
  );
}

/**
 * Ensures each positive cart line is a known catalog key and the summed
 * quantity per catalog item does not exceed maxByKey.
 */
export function validateApplyCartLines(
  cartLines: ApplyCartLine[],
  maxByKey: Map<string, number>,
): ValidateApplyLineQuantitiesResult {
  const totals = new Map<string, number>();
  const lines: ApplyRequestLine[] = [];
  const kept: ApplyCartLine[] = [];

  for (const cartLine of cartLines) {
    const qty = Math.floor(
      Number.isFinite(cartLine.quantity) ? cartLine.quantity : 0,
    );
    if (qty <= 0) {
      continue;
    }

    const max = maxByKey.get(cartLine.catalogKey);
    if (max === undefined) {
      return {
        ok: false,
        message:
          'The catalog changed while you were ordering. Refresh the page and try again.',
      };
    }

    const nextTotal = (totals.get(cartLine.catalogKey) ?? 0) + qty;
    if (nextTotal > max) {
      return {
        ok: false,
        message:
          'Quantity exceeds the maximum allowed for one or more items. Adjust your cart and try again.',
      };
    }
    totals.set(cartLine.catalogKey, nextTotal);

    const line = lineFromCatalogKey(cartLine.catalogKey, qty);
    if (!line) {
      return {
        ok: false,
        message: 'Invalid item in your cart. Refresh the page and try again.',
      };
    }
    lines.push(line);
    kept.push({ ...cartLine, quantity: qty });
  }

  if (lines.length === 0) {
    return {
      ok: false,
      message: 'Add at least one document or package.',
    };
  }

  return { ok: true, lines, cartLines: kept };
}

/** @deprecated Prefer validateApplyCartLines for multi-line carts. */
export function validateApplyLineQuantities(
  quantities: Record<string, number>,
  maxByKey: Map<string, number>,
): ValidateApplyLineQuantitiesResult {
  const cartLines: ApplyCartLine[] = Object.entries(quantities).map(
    ([catalogKey, quantity]) => ({
      clientId: createApplyCartClientId(),
      catalogKey,
      quantity,
    }),
  );
  return validateApplyCartLines(cartLines, maxByKey);
}

export function attachOptionAnswersToCartLines(
  cartLines: ApplyCartLine[],
  optionAnswers: Record<string, string>,
  optionsByDocumentId: Map<
    number,
    Array<{ id: number; is_required?: boolean }>
  >,
): ApplyRequestLine[] {
  return cartLines.flatMap((cartLine) => {
    const base = lineFromCatalogKey(cartLine.catalogKey, cartLine.quantity);
    if (!base) return [];
    if (base.requestable_type !== 'document') {
      return [base];
    }
    const options = optionsByDocumentId.get(base.requestable_id) ?? [];
    const answers = options
      .map((option) => ({
        option_id: option.id,
        value: (
          optionAnswers[`${cartLine.clientId}:${option.id}`] ?? ''
        ).trim(),
      }))
      .filter((row) => row.value !== '');
    if (answers.length === 0) {
      return [base];
    }
    return [{ ...base, option_answers: answers }];
  });
}

export function buildApplyRequestPayload(
  values: ApplyRequestFormValues,
  lines: ApplyRequestLine[],
  supportingUploads: ApplySupportingUpload[] = [],
): ApplyRequestPayload {
  return {
    email: values.email.trim(),
    contact_number: values.contactNumber.trim(),
    receive_mode: values.receiveMode,
    payment_method_id: Number(values.paymentMethodId),
    secure_email_requested: values.secureEmail,
    delivery_address: values.deliveryAddress?.trim() || null,
    purpose: values.purpose?.trim() || null,
    lines,
    ...(supportingUploads.length > 0
      ? { supporting_uploads: supportingUploads }
      : {}),
  };
}

export async function submitApplyRequest(
  payload: ApplyRequestPayload,
): Promise<{ id: string }> {
  const { data } = await registrarSvc.post<{
    data?: { id?: string | number };
  }>('v1/drs/apply/applications', payload);

  const id = data?.data?.id;
  if (id === undefined || id === null || String(id).trim() === '') {
    throw new Error('Application was created but no id was returned.');
  }

  return { id: String(id) };
}
