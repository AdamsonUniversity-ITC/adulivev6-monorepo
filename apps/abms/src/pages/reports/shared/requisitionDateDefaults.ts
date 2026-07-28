import { getEntryDateDefaults } from './entryDateDefaults';

export type RequisitionDateDefaultsPayload = {
  requisition_first_dates?: Record<string, unknown>;
  current_date?: unknown;
};

export const getRequisitionDateDefaults = (
  payload: RequisitionDateDefaultsPayload,
  schoolYear: string,
) => getEntryDateDefaults(payload.requisition_first_dates, payload.current_date, schoolYear);
