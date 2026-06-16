export type DRSApplicationHistorySummary = Record<
  string,
  | boolean
  | {
      changed?: string[];
      added?: number;
      removed?: number;
      updated?: number;
    }
>;

export type DRSApplicationHistorySnapshotMeta = {
  drs_no: string | null;
  status: string | null;
  updated_at: string | null;
  documents_count: number;
  clearances_count: number;
  stage_runs_count: number;
  tasks_count: number;
};

export type DRSApplicationHistoryRow = {
  id: string;
  version: number;
  event: string | null;
  description: string;
  summary: DRSApplicationHistorySummary;
  meta?: Record<string, unknown>;
  snapshot_meta: DRSApplicationHistorySnapshotMeta;
  causer?: {
    id: number | string | null;
    type: string | null;
  };
  created_at: string | null;
  can_restore: boolean;
};

export type DRSApplicationHistoryResponse = {
  rows: DRSApplicationHistoryRow[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
};
