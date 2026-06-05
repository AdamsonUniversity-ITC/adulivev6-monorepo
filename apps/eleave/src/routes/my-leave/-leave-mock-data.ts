export type LeaveRequestStatus =
  | "draft"
  | "pending"
  | "approved"
  | "rejected"

export type LeaveRequestRow = {
  id: string
  leave_type: string
  date_from: string
  date_to: string
  reason: string
  address: string
  status: LeaveRequestStatus
  filed_at: string
}

export const MOCK_LEAVE_REQUESTS: LeaveRequestRow[] = [
  {
    id: "1",
    leave_type: "Vacation Leave",
    date_from: "2026-03-10",
    date_to: "2026-03-14",
    reason: "Family vacation out of town.",
    address: "Cebu City, Philippines",
    status: "approved",
    filed_at: "2026-02-20T08:30:00Z",
  },
  {
    id: "2",
    leave_type: "Sick Leave",
    date_from: "2026-02-18",
    date_to: "2026-02-19",
    reason: "Flu and fever; doctor advised rest.",
    address: "Home — Quezon City",
    status: "pending",
    filed_at: "2026-02-17T14:15:00Z",
  },
  {
    id: "3",
    leave_type: "Emergency Leave",
    date_from: "2026-02-05",
    date_to: "2026-02-05",
    reason: "Urgent family matter.",
    address: "Bulacan, Philippines",
    status: "approved",
    filed_at: "2026-02-04T09:00:00Z",
  },
  {
    id: "4",
    leave_type: "Special Leave",
    date_from: "2026-04-01",
    date_to: "2026-04-02",
    reason: "Personal errands and documentation.",
    address: "Manila, Philippines",
    status: "draft",
    filed_at: "2026-02-25T11:20:00Z",
  },
  {
    id: "5",
    leave_type: "Vacation Leave",
    date_from: "2026-01-20",
    date_to: "2026-01-24",
    reason: "Year-end break with family.",
    address: "Baguio City, Philippines",
    status: "rejected",
    filed_at: "2026-01-10T16:45:00Z",
  },
  {
    id: "6",
    leave_type: "Sick Leave",
    date_from: "2026-03-03",
    date_to: "2026-03-04",
    reason: "Medical check-up and recovery.",
    address: "Home — Pasig City",
    status: "pending",
    filed_at: "2026-03-02T07:50:00Z",
  },
  {
    id: "7",
    leave_type: "Maternity Leave",
    date_from: "2026-05-01",
    date_to: "2026-08-01",
    reason: "Maternity leave as per company policy.",
    address: "Makati City, Philippines",
    status: "pending",
    filed_at: "2026-02-28T10:00:00Z",
  },
  {
    id: "8",
    leave_type: "Vacation Leave",
    date_from: "2026-06-15",
    date_to: "2026-06-20",
    reason: "Summer trip with children.",
    address: "Palawan, Philippines",
    status: "draft",
    filed_at: "2026-03-01T13:30:00Z",
  },
  {
    id: "9",
    leave_type: "Paternity Leave",
    date_from: "2026-04-10",
    date_to: "2026-04-17",
    reason: "Newborn care support.",
    address: "Taguig City, Philippines",
    status: "approved",
    filed_at: "2026-03-15T08:00:00Z",
  },
  {
    id: "10",
    leave_type: "Emergency Leave",
    date_from: "2026-02-28",
    date_to: "2026-02-28",
    reason: "Flooding in residence area.",
    address: "Marikina City, Philippines",
    status: "approved",
    filed_at: "2026-02-28T06:15:00Z",
  },
  {
    id: "11",
    leave_type: "Special Leave",
    date_from: "2026-07-04",
    date_to: "2026-07-05",
    reason: "Attending professional seminar.",
    address: "Cavite, Philippines",
    status: "pending",
    filed_at: "2026-03-20T15:40:00Z",
  },
  {
    id: "12",
    leave_type: "Vacation Leave",
    date_from: "2025-12-23",
    date_to: "2025-12-31",
    reason: "Holiday season leave.",
    address: "Iloilo City, Philippines",
    status: "approved",
    filed_at: "2025-12-01T09:30:00Z",
  },
]
