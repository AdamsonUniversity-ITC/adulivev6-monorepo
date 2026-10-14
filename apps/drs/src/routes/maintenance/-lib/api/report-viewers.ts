import { registrarSvc } from '@repo/axios-config/registrar-service';

export type ReportViewer = {
  id: number;
  emp_no: string;
  name: string | null;
  email: string | null;
  position: string | null;
  created_at: string | null;
};

export const fetchReportViewers = async (): Promise<ReportViewer[]> => {
  const { data } = await registrarSvc.get<{ data?: ReportViewer[] }>(
    'v1/drs/report-viewers',
  );

  return Array.isArray(data?.data) ? data.data : [];
};

export const addReportViewer = async (empNo: string): Promise<ReportViewer> => {
  const { data } = await registrarSvc.post<{ data: ReportViewer }>(
    'v1/drs/report-viewers',
    { emp_no: empNo },
  );

  return data.data;
};

export const removeReportViewer = async (empNo: string): Promise<void> => {
  await registrarSvc.delete(`v1/drs/report-viewers/${encodeURIComponent(empNo)}`);
};
