import { registrarSvc } from '@repo/axios-config/registrar-service';

import type { ApplyRequestFormValues } from '../applyRequestSchema.ts';

export type ApplyRequestLine = {
  requestable_type: 'document' | 'package';
  requestable_id: number;
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
  delivery_address: string | null;
  purpose: string | null;
  lines: ApplyRequestLine[];
  supporting_uploads?: ApplySupportingUpload[];
};

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
  | { ok: true; lines: ApplyRequestLine[] }
  | { ok: false; message: string };

/**
 * Ensures each positive quantity is a known catalog key and does not exceed
 * the per-line max from `allow_multiple_per_request` (via maxByKey).
 */
export function validateApplyLineQuantities(
  quantities: Record<string, number>,
  maxByKey: Map<string, number>,
): ValidateApplyLineQuantitiesResult {
  const lines: ApplyRequestLine[] = [];

  for (const [key, rawQty] of Object.entries(quantities)) {
    const qty = Math.floor(Number.isFinite(rawQty) ? rawQty : 0);
    if (qty <= 0) {
      continue;
    }

    const max = maxByKey.get(key);
    if (max === undefined) {
      return {
        ok: false,
        message:
          'The catalog changed while you were ordering. Refresh the page and try again.',
      };
    }
    if (qty > max) {
      return {
        ok: false,
        message:
          'Quantity exceeds the maximum allowed for one or more items. Adjust your cart and try again.',
      };
    }

    const line = lineFromCatalogKey(key, qty);
    if (!line) {
      return {
        ok: false,
        message: 'Invalid item in your cart. Refresh the page and try again.',
      };
    }
    lines.push(line);
  }

  if (lines.length === 0) {
    return {
      ok: false,
      message: 'Add at least one document or package.',
    };
  }

  return { ok: true, lines };
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
): Promise<void> {
  await registrarSvc.post('v1/drs/apply/applications', payload);
}
