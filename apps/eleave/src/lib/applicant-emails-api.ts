import { hrmdoSvc } from "@/lib/api"

export const FOLLOW_UP_REMARK_TEXT_MAX_LENGTH = 2000

export type ApplicantFollowUpRemarkRecord = {
  id: number
  label: string
  text: string
  display_order: number
  is_active: boolean
  created_at: string | null
  updated_at: string | null
}

export type ApplicantFollowUpRemarkPayload = {
  label: string
  text: string
  display_order: number
  is_active: boolean
}

export async function fetchApplicantFollowUpRemarks(options?: {
  active?: boolean
}): Promise<ApplicantFollowUpRemarkRecord[]> {
  const response = await hrmdoSvc.get<{
    data: ApplicantFollowUpRemarkRecord[]
  }>("v1/applicant-followup-remarks", {
    params: options?.active ? { active: 1 } : undefined,
  })

  return (response.data.data ?? []).map(normalizeRemark)
}

export async function createApplicantFollowUpRemark(
  payload: ApplicantFollowUpRemarkPayload,
): Promise<ApplicantFollowUpRemarkRecord> {
  const response = await hrmdoSvc.post<{ data: ApplicantFollowUpRemarkRecord }>(
    "v1/applicant-followup-remarks",
    payload,
  )

  return normalizeRemark(response.data.data)
}

export type ApplicantFollowUpRemarkPreview = {
  subject: string
  html: string
}

/** Renders the follow-up email for a draft remark using sample leave details. */
export async function previewApplicantFollowUpRemark(
  text: string,
): Promise<ApplicantFollowUpRemarkPreview> {
  const response = await hrmdoSvc.post<{
    data: ApplicantFollowUpRemarkPreview
  }>("v1/applicant-followup-remarks/preview", { text })

  return response.data.data
}

export async function updateApplicantFollowUpRemark(
  id: number,
  payload: ApplicantFollowUpRemarkPayload,
): Promise<ApplicantFollowUpRemarkRecord> {
  const response = await hrmdoSvc.patch<{
    data: ApplicantFollowUpRemarkRecord
  }>(`v1/applicant-followup-remarks/${id}`, payload)

  return normalizeRemark(response.data.data)
}

export async function deleteApplicantFollowUpRemark(id: number): Promise<void> {
  await hrmdoSvc.delete(`v1/applicant-followup-remarks/${id}`)
}

function normalizeRemark(row: ApplicantFollowUpRemarkRecord): ApplicantFollowUpRemarkRecord {
  return {
    ...row,
    display_order: Number(row.display_order ?? 0),
    is_active: Boolean(row.is_active),
  }
}

export type ApplicantFollowUpSendRecord = {
  id: number
  leave_application_id: number
  remark_id: number | null
  remark_label: string
  remark_text: string
  recipient_email: string
  sent_by: string
  sent_by_name: string | null
  created_at: string | null
}

export type ApplicantFollowUpPayload = {
  remark_id: number
  remark_text: string
}

export type ApplicantFollowUpPreview = {
  recipient_email: string | null
  subject: string
  html: string
}

export async function fetchApplicantFollowUps(
  leaveApplicationId: number,
): Promise<ApplicantFollowUpSendRecord[]> {
  const response = await hrmdoSvc.get<{ data: ApplicantFollowUpSendRecord[] }>(
    `v1/leave-applications/${leaveApplicationId}/applicant-followups`,
  )

  return response.data.data ?? []
}

export async function previewApplicantFollowUp(
  leaveApplicationId: number,
  payload: ApplicantFollowUpPayload,
): Promise<ApplicantFollowUpPreview> {
  const response = await hrmdoSvc.post<{ data: ApplicantFollowUpPreview }>(
    `v1/leave-applications/${leaveApplicationId}/applicant-followup-preview`,
    payload,
  )

  return response.data.data
}

export async function sendApplicantFollowUp(
  leaveApplicationId: number,
  payload: ApplicantFollowUpPayload,
): Promise<ApplicantFollowUpSendRecord> {
  const response = await hrmdoSvc.post<{ data: ApplicantFollowUpSendRecord }>(
    `v1/leave-applications/${leaveApplicationId}/applicant-followups`,
    payload,
  )

  return response.data.data
}
