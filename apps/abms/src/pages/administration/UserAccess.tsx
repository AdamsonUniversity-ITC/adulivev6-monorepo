import { useState, useRef, useEffect } from 'react';
import { z } from 'zod';
import AdamsonBudgetLayout from '../../layouts/Screenlayout.tsx';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@repo/ui/components/table';
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/components/card';
import { Users, UserPlus, Search, X, Loader2, UserCheck, ShieldCheck, ChevronLeft, Save, Building2, Layers, ChevronDown, ChevronUp, AlertCircle, CheckCircle2 } from 'lucide-react';
import { userdepartmentRoute } from '../../router';
import { financeSvc } from '@repo/axios-config';
import { useRouteContext } from '@tanstack/react-router';

// ─────────────────────────────────────────────────────────────────────────────
// Zod schema
// ─────────────────────────────────────────────────────────────────────────────
const userAccessSchema = z.object({
  emp_no: z.string(),
  proposal_permission_id: z.union([z.string(), z.number()]).nullable().optional(),
  departments: z
    .array(z.object({
      id: z.union([z.string(), z.number()]),
      name: z.string(),
      kind: z.enum(['Department', 'Section']),
      permissions: z
        .array(z.union([z.string(), z.number()]))
        .min(1, 'At least one permission must be selected per department/section.'),
      proposal_entry: z.union([
        z.object({
          from: z.string().min(1, 'Start date is required.'),
          to: z.string().min(1, 'End date is required.'),
        }),
        z.null(),
      ]),
    }))
    .min(1, 'At least one department or section must be assigned.'),
});

type FormErrors = Partial<Record<
  'departments' | string,
  string
>>;

// ─────────────────────────────────────────────────────────────────────────────
// Toast
// ─────────────────────────────────────────────────────────────────────────────
interface ToastData {
  emp_no: string;
  type: 'success' | 'error';
  message: string;
}

function Toast({ toast, isDark, onDismiss }: { toast: ToastData; isDark: boolean; onDismiss: (id: number) => void }) {
  const isSuccess = toast.type === 'success';

  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), 4000);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  return (
    <div
      className="flex items-start gap-3 px-4 py-3 rounded-xl shadow-2xl min-w-[280px] max-w-sm animate-in"
      style={{
        background: isDark
          ? (isSuccess ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)')
          : (isSuccess ? 'rgba(240, 253, 244, 0.98)' : 'rgba(254, 242, 242, 0.98)'),
        border: `1px solid ${isSuccess
          ? (isDark ? 'rgba(52, 211, 153, 0.40)' : 'rgba(16, 185, 129, 0.35)')
          : (isDark ? 'rgba(239,  68,  68, 0.40)' : 'rgba(239,  68,  68, 0.35)')}`,
        backdropFilter: 'blur(12px)',
        animation: 'slideInRight 0.25s ease-out',
      }}
    >
      {isSuccess
        ? <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" style={{ color: isDark ? '#34d399' : '#059669' }} />
        : <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: isDark ? '#f87171' : '#dc2626' }} />
      }
      <span className="text-sm flex-1 leading-snug" style={{ color: isDark ? '#e2e8f0' : '#0f172a' }}>
        {toast.message}
      </span>
      <button
        onClick={() => onDismiss(toast.id)}
        className="shrink-0 opacity-50 hover:opacity-100 transition-opacity"
        style={{ color: isDark ? '#94a3b8' : '#64748b' }}
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

function ToastContainer({ toasts, isDark, onDismiss }: { toasts: ToastData[]; isDark: boolean; onDismiss: (id: number) => void }) {
  if (toasts.length === 0) return null;
  return (
    <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2 items-end">
      <style>{`
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(20px); }
          to   { opacity: 1; transform: translateX(0); }
        }
      `}</style>
      {toasts.map((t) => (
        <Toast key={t.id} toast={t} isDark={isDark} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Design tokens
// ─────────────────────────────────────────────────────────────────────────────
const T = {
  dark: {
    titleColor: '#f8fafc',
    subColor: '#94a3b8',
    cardBg: 'rgba(15, 23, 42, 0.90)',
    cardBorder: 'rgba(99, 155, 255, 0.30)',
    cardShadow: '0 4px 40px rgba(37, 99, 235, 0.20)',
    cardHeaderBorder: 'rgba(99, 155, 255, 0.20)',
    cardTitleColor: '#f1f5f9',
    tableHeadBg: 'rgba(15, 30, 60, 0.85)',
    tableHeadText: '#93c5fd',
    tableHeadBorder: 'rgba(99, 155, 255, 0.25)',
    rowBorder: 'rgba(99, 155, 255, 0.12)',
    rowHoverBg: 'rgba(59, 130, 246, 0.12)',
    cellText: '#e2e8f0',
    cellMuted: '#94a3b8',
    pillBg: 'rgba(59, 130, 246, 0.20)',
    pillText: '#93c5fd',
    pillBorder: 'rgba(99, 155, 255, 0.40)',
    addBtnBg: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
    addBtnText: '#ffffff',
    addBtnBorder: 'rgba(99, 155, 255, 0.50)',
    addBtnShadow: '0 2px 12px rgba(37, 99, 235, 0.40)',
    addBtnHoverBg: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
    // Modal tokens
    modalOverlay: 'rgba(0, 0, 0, 0.70)',
    modalBg: 'rgba(10, 18, 38, 0.98)',
    modalBorder: 'rgba(99, 155, 255, 0.35)',
    modalShadow: '0 24px 80px rgba(0, 0, 0, 0.60)',
    inputBg: 'rgba(15, 30, 60, 0.80)',
    inputBorder: 'rgba(99, 155, 255, 0.30)',
    inputBorderFocus: 'rgba(99, 155, 255, 0.70)',
    inputText: '#f1f5f9',
    inputPlaceholder: '#64748b',
    resultRowBg: 'rgba(15, 30, 60, 0.60)',
    resultRowHover: 'rgba(59, 130, 246, 0.18)',
    resultRowBorder: 'rgba(99, 155, 255, 0.12)',
    resultNameText: '#e2e8f0',
    resultMetaText: '#93c5fd',
    selectBtnBg: 'rgba(37, 99, 235, 0.20)',
    selectBtnBorder: 'rgba(99, 155, 255, 0.40)',
    selectBtnText: '#93c5fd',
    selectBtnHoverBg: 'rgba(37, 99, 235, 0.40)',
    dividerColor: 'rgba(99, 155, 255, 0.15)',
    emptyText: '#64748b',
    // Permission-specific tokens
    permRowBg: 'rgba(15, 30, 60, 0.50)',
    permRowHover: 'rgba(59, 130, 246, 0.10)',
    permRowBorder: 'rgba(99, 155, 255, 0.10)',
    checkboxAccent: '#3b82f6',
    saveBtnBg: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
    saveBtnText: '#ffffff',
    saveBtnBorder: 'rgba(99, 155, 255, 0.50)',
    saveBtnShadow: '0 2px 12px rgba(37, 99, 235, 0.40)',
    saveBtnHoverBg: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
    backBtnBg: 'rgba(15, 30, 60, 0.80)',
    backBtnBorder: 'rgba(99, 155, 255, 0.30)',
    backBtnText: '#93c5fd',
    backBtnHoverBg: 'rgba(59, 130, 246, 0.15)',
    avatarRing: 'rgba(99, 155, 255, 0.50)',
    badgeBg: 'rgba(37, 99, 235, 0.20)',
    badgeBorder: 'rgba(99, 155, 255, 0.40)',
    badgeText: '#93c5fd',
  },
  light: {
    titleColor: '#0f172a',
    subColor: '#475569',
    cardBg: 'rgba(255, 255, 255, 0.95)',
    cardBorder: 'rgba(37, 99, 235, 0.20)',
    cardShadow: '0 4px 32px rgba(0, 48, 135, 0.12)',
    cardHeaderBorder: 'rgba(37, 99, 235, 0.15)',
    cardTitleColor: '#0f172a',
    tableHeadBg: 'rgba(219, 234, 254, 0.90)',
    tableHeadText: '#1d4ed8',
    tableHeadBorder: 'rgba(37, 99, 235, 0.20)',
    rowBorder: 'rgba(37, 99, 235, 0.10)',
    rowHoverBg: 'rgba(219, 234, 254, 0.70)',
    cellText: '#0f172a',
    cellMuted: '#64748b',
    pillBg: 'rgba(37, 99, 235, 0.12)',
    pillText: '#1d4ed8',
    pillBorder: 'rgba(37, 99, 235, 0.30)',
    addBtnBg: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
    addBtnText: '#ffffff',
    addBtnBorder: 'rgba(29, 78, 216, 0.40)',
    addBtnShadow: '0 2px 12px rgba(37, 99, 235, 0.30)',
    addBtnHoverBg: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
    // Modal tokens
    modalOverlay: 'rgba(15, 23, 42, 0.55)',
    modalBg: 'rgba(255, 255, 255, 0.99)',
    modalBorder: 'rgba(37, 99, 235, 0.25)',
    modalShadow: '0 24px 80px rgba(0, 48, 135, 0.20)',
    inputBg: 'rgba(241, 245, 249, 0.90)',
    inputBorder: 'rgba(37, 99, 235, 0.25)',
    inputBorderFocus: 'rgba(37, 99, 235, 0.60)',
    inputText: '#0f172a',
    inputPlaceholder: '#94a3b8',
    resultRowBg: 'rgba(248, 250, 252, 0.80)',
    resultRowHover: 'rgba(219, 234, 254, 0.80)',
    resultRowBorder: 'rgba(37, 99, 235, 0.10)',
    resultNameText: '#0f172a',
    resultMetaText: '#1d4ed8',
    selectBtnBg: 'rgba(37, 99, 235, 0.10)',
    selectBtnBorder: 'rgba(37, 99, 235, 0.30)',
    selectBtnText: '#1d4ed8',
    selectBtnHoverBg: 'rgba(37, 99, 235, 0.20)',
    dividerColor: 'rgba(37, 99, 235, 0.12)',
    emptyText: '#94a3b8',
    // Permission-specific tokens
    permRowBg: 'rgba(248, 250, 252, 0.80)',
    permRowHover: 'rgba(219, 234, 254, 0.60)',
    permRowBorder: 'rgba(37, 99, 235, 0.08)',
    checkboxAccent: '#2563eb',
    saveBtnBg: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
    saveBtnText: '#ffffff',
    saveBtnBorder: 'rgba(29, 78, 216, 0.40)',
    saveBtnShadow: '0 2px 12px rgba(37, 99, 235, 0.30)',
    saveBtnHoverBg: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
    backBtnBg: 'rgba(241, 245, 249, 0.90)',
    backBtnBorder: 'rgba(37, 99, 235, 0.25)',
    backBtnText: '#1d4ed8',
    backBtnHoverBg: 'rgba(219, 234, 254, 0.80)',
    avatarRing: 'rgba(37, 99, 235, 0.40)',
    badgeBg: 'rgba(37, 99, 235, 0.10)',
    badgeBorder: 'rgba(37, 99, 235, 0.30)',
    badgeText: '#1d4ed8',
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
interface UserAccessRecord {
  emp_no: string;
  full_name: string;
  departments: { id: number | string; name: string; kind: 'Department' | 'Section' }[];
}

interface Teacher {
  emp_no: string;
  full_name: string;
  lname: string;
  fname: string;
  mname: string;
  department?: string;
}

interface Permission {
  id: number | string;
  name: string;
  group_id?: number;
  guard_name?: string;
  label?: string;
}

interface Department {
  id: number | string;
  name: string;
  [key: string]: unknown;
}

interface Section {
  id: number | string;
  name: string;
  [key: string]: unknown;
}

interface DeptData {
  departments: Department[];
  sections: Section[];
}

type DeptOrSection = { id: number | string; name: string; kind: 'Department' | 'Section' };

interface ExistingAccessEntry {
  id: number | string;
  kind: 'Department' | 'Section';
  permissions: (number | string)[];
  proposal_entry: { from: string; to: string } | null;
}
// ─────────────────────────────────────────────────────────────────────────────
// User Management Modal
// ─────────────────────────────────────────────────────────────────────────────
function UserManagementModal({
  isOpen,
  onClose,
  onBack,
  teacher,
  permissions,
  deptData,
  isDark,
  onToast,
  onUserSaved,
  existingAccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  onBack: () => void;
  teacher: Teacher | null;
  permissions: Permission[];
  deptData: DeptData | null;
  isDark: boolean;
  onToast: (type: 'success' | 'error', message: string) => void;
  onUserSaved?: () => void;
  existingAccess: ExistingAccessEntry[] | null;
}) {
  const t = isDark ? T.dark : T.light;

  // Per-dept permissions: key = `${kind}-${id}`, value = Record<permId, bool>
  const [deptPerms, setDeptPerms] = useState<Record<string, Record<string | number, boolean>>>({});

  // Per-dept proposal dates: key = `${kind}-${id}`
  const [deptProposalFrom, setDeptProposalFrom] = useState<Record<string, string>>({});
  const [deptProposalTo, setDeptProposalTo] = useState<Record<string, string>>({});

  // Collapsed state for each dept card
  const [collapsedDepts, setCollapsedDepts] = useState<Record<string, boolean>>({});

  // Department / section assignment (multiple)
  const [selectedDepts, setSelectedDepts] = useState<DeptOrSection[]>([]);
  const [deptPickerOpen, setDeptPickerOpen] = useState(false);
  const [deptSearch, setDeptSearch] = useState('');

  // Validation errors & saving state
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  const handleRemoveAll = async () => {
    if (!teacher) return;
    setIsRemoving(true);
    try {
      await financeSvc.delete(`/abms/access/users/${teacher.emp_no}`);
      onToast('success', 'All access removed successfully.');
      onUserSaved?.();
      onClose();
    } catch {
      onToast('error', 'Failed to remove access. Please try again.');
    } finally {
      setIsRemoving(false);
    }
  };

  const deptKey = (item: DeptOrSection) => `${item.kind}-${item.id}`;

  // When a dept is added initialise its permission map
  const addDept = (item: DeptOrSection) => {
    const key = deptKey(item);
    setSelectedDepts((prev) => [...prev, item]);
    setDeptPerms((prev) => {
      if (prev[key]) return prev;
      const init: Record<string | number, boolean> = {};
      permissions.forEach((p) => { init[p.id] = false; });
      return { ...prev, [key]: init };
    });
    setCollapsedDepts((prev) => ({ ...prev, [key]: false }));
  };

  const removeDept = (item: DeptOrSection) => {
    const key = deptKey(item);
    setSelectedDepts((prev) => prev.filter((d) => !(d.id === item.id && d.kind === item.kind)));
    setDeptPerms((prev) => { const n = { ...prev }; delete n[key]; return n; });
    setDeptProposalFrom((prev) => { const n = { ...prev }; delete n[key]; return n; });
    setDeptProposalTo((prev) => { const n = { ...prev }; delete n[key]; return n; });
    setCollapsedDepts((prev) => { const n = { ...prev }; delete n[key]; return n; });
  };

  const toggleDeptPerm = (key: string, permId: string | number) => {
    setDeptPerms((prev) => ({
      ...prev,
      [key]: { ...prev[key], [permId]: !prev[key]?.[permId] },
    }));
  };

  const toggleAllDeptPerms = (key: string) => {
    setDeptPerms((prev) => {
      const current = prev[key] ?? {};
      const allOn = permissions.every((p) => current[p.id]);
      const next: Record<string | number, boolean> = {};
      permissions.forEach((p) => { next[p.id] = !allOn; });
      return { ...prev, [key]: next };
    });

  };

  useEffect(() => {
    if (isOpen && teacher) {
      setDeptPickerOpen(false);
      setDeptSearch('');
      setErrors({});
      setIsSaving(false);

      if (existingAccess && existingAccess.length > 0) {
        // ── Edit mode: rehydrate from existing data ──
        const depts: DeptOrSection[] = existingAccess.map((e) => {
          const list = e.kind === 'Department'
            ? deptData?.departments
            : deptData?.sections;
          const match = list?.find((d) => String(d.id) === String(e.id));
          return { id: e.id, name: match?.name ?? String(e.id), kind: e.kind };
        });

        const perms: Record<string, Record<string | number, boolean>> = {};
        const fromDates: Record<string, string> = {};
        const toDates: Record<string, string> = {};
        const collapsed: Record<string, boolean> = {};

        existingAccess.forEach((e) => {
          const key = `${e.kind}-${e.id}`;
          const init: Record<string | number, boolean> = {};
          permissions.forEach((p) => { init[p.id] = false; });
          e.permissions.forEach((pid) => { init[pid] = true; });
          perms[key] = init;
          if (e.proposal_entry) {
            fromDates[key] = e.proposal_entry.from;
            toDates[key] = e.proposal_entry.to;
          }
          collapsed[key] = false;
        });

        setSelectedDepts(depts);
        setDeptPerms(perms);
        setDeptProposalFrom(fromDates);
        setDeptProposalTo(toDates);
        setCollapsedDepts(collapsed);
      } else {
        // ── Add mode: fresh slate ──
        setDeptPerms({});
        setDeptProposalFrom({});
        setDeptProposalTo({});
        setCollapsedDepts({});
        setSelectedDepts([]);
      }
    }
  }, [isOpen, teacher, permissions, existingAccess]);

  const proposalPermId = permissions.find((p) => p.name === 'allow-budget-proposal-entry')?.id;

  // Counts helper
  const deptCheckedCount = (key: string) =>
    Object.values(deptPerms[key] ?? {}).filter(Boolean).length;
  const deptAllChecked = (key: string) =>
    permissions.length > 0 && deptCheckedCount(key) === permissions.length;
  const deptSomeChecked = (key: string) =>
    deptCheckedCount(key) > 0 && !deptAllChecked(key);

  // Total granted across all depts (for header badge)
  const totalGranted = selectedDepts.reduce((sum, d) => sum + deptCheckedCount(deptKey(d)), 0);

  // Merge & sort departments + sections alphabetically
  const mergedList: DeptOrSection[] = [
    ...(deptData?.departments ?? []).map((d) => ({ id: d.id, name: d.name, kind: 'Department' as const })),
    ...(deptData?.sections ?? []).map((s) => ({ id: s.id, name: s.name, kind: 'Section' as const })),
  ].sort((a, b) => a.name.localeCompare(b.name));

  const filteredList = deptSearch.trim()
    ? mergedList.filter((item) => item.name.toLowerCase().includes(deptSearch.trim().toLowerCase()))
    : mergedList;


  const handleSave = async () => {
    if (!teacher) return;

    const departmentsPayload = selectedDepts.map((dept) => {
      const key = deptKey(dept);
      const granted = permissions.filter((p) => deptPerms[key]?.[p.id]).map((p) => p.id);
      const isProposalOn = proposalPermId !== undefined && !!deptPerms[key]?.[proposalPermId];
      return {
        id: dept.id,
        name: dept.name,
        kind: dept.kind,
        permissions: granted,
        proposal_entry: isProposalOn
          ? { from: deptProposalFrom[key] ?? '', to: deptProposalTo[key] ?? '' }
          : null,
      };
    });

    const payload = {
      emp_no: teacher.emp_no,
      proposal_permission_id: proposalPermId ?? null,
      departments: departmentsPayload,
    };

    // ── Zod validation ──────────────────────────────────────────────────────
    const result = userAccessSchema.safeParse(payload);

    if (!result.success) {
      const fieldErrors: FormErrors = {};
      for (const issue of result.error.issues) {
        const path = issue.path.join('.');
        if (path === 'departments') fieldErrors.departments = issue.message;
        // per-dept: departments.0.permissions → capture index
        const deptPermMatch = path.match(/^departments\.(\d+)\.permissions/);
        if (deptPermMatch) {
          const idx = Number(deptPermMatch[1]);
          const d = selectedDepts[idx];
          if (d) fieldErrors[`dept_${deptKey(d)}_permissions`] = issue.message;
        }
        const deptProposalFrom = path.match(/^departments\.(\d+)\.proposal_entry\.from/);
        if (deptProposalFrom) {
          const idx = Number(deptProposalFrom[1]);
          const d = selectedDepts[idx];
          if (d) fieldErrors[`dept_${deptKey(d)}_proposal_from`] = issue.message;
        }
        const deptProposalTo = path.match(/^departments\.(\d+)\.proposal_entry\.to/);
        if (deptProposalTo) {
          const idx = Number(deptProposalTo[1]);
          const d = selectedDepts[idx];
          if (d) fieldErrors[`dept_${deptKey(d)}_proposal_to`] = issue.message;
        }
      }
      setErrors(fieldErrors);
      return;
    }

    setErrors({});

    // ── API call ─────────────────────────────────────────────────────────────
    setIsSaving(true);
    try {
      const { data } = await financeSvc.post('/abms/access/users', result.data);
      // console.log('Store response:', data);
      onToast('success', 'User access saved successfully.');
      onUserSaved?.();
      onClose();
    } catch (err) {
      // console.error('Failed to save user access:', err);
      onToast('error', 'Failed to save user access. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen || !teacher) return null;

  const avatarSrc = `https://live.adamson.edu.ph/legacy/primarypicavatar/getuserimg_idno.php?x=${teacher.emp_no}_2`;
  const fallbackSrc = `https://ui-avatars.com/api/?name=${encodeURIComponent(teacher.full_name)}&background=2563eb&color=fff&size=128`;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      style={{ background: t.modalOverlay, backdropFilter: 'blur(4px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full max-w-lg rounded-2xl overflow-hidden flex flex-col"
        style={{
          background: t.modalBg,
          border: `1px solid ${t.modalBorder}`,
          boxShadow: t.modalShadow,
          maxHeight: '90vh',
        }}
      >
        {/* ── Modal Header ── */}
        <div
          className="flex items-center justify-between px-6 py-4 shrink-0"
          style={{ borderBottom: `1px solid ${t.dividerColor}` }}
        >
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4" style={{ color: t.resultMetaText }} />
            <span className="text-sm font-semibold tracking-wide" style={{ color: t.resultNameText }}>
              Manage User Permissions
            </span>
            {existingAccess && existingAccess.length > 0 && (
              <span
                className="text-xs font-semibold px-2 py-0.5 rounded-full"
                style={{ background: t.pillBg, color: t.pillText, border: `1px solid ${t.pillBorder}` }}
              >
                Editing existing
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {/* Back button */}
            <button
              onClick={onBack}
              className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all duration-150"
              style={{
                background: t.backBtnBg,
                color: t.backBtnText,
                border: `1px solid ${t.backBtnBorder}`,
              }}
              onMouseEnter={e =>
                ((e.currentTarget as HTMLElement).style.background = t.backBtnHoverBg)
              }
              onMouseLeave={e =>
                ((e.currentTarget as HTMLElement).style.background = t.backBtnBg)
              }
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              Back
            </button>
            {/* Close button */}
            <button
              onClick={onClose}
              className="w-7 h-7 flex items-center justify-center rounded-lg transition-all duration-150"
              style={{ color: t.cellMuted, background: 'transparent' }}
              onMouseEnter={e =>
                ((e.currentTarget as HTMLElement).style.background = t.resultRowHover)
              }
              onMouseLeave={e =>
                ((e.currentTarget as HTMLElement).style.background = 'transparent')
              }
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ── User Profile Card ── */}
        <div
          className="px-6 py-5 flex items-center gap-4 shrink-0"
          style={{ borderBottom: `1px solid ${t.dividerColor}` }}
        >
          {/* Avatar */}
          <div
            className="relative shrink-0"
            style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              boxShadow: `0 0 0 3px ${t.avatarRing}, 0 4px 16px rgba(37,99,235,0.25)`,
            }}
          >
            <img
              src={avatarSrc}
              alt={teacher.full_name}
              className="w-16 h-16 rounded-full object-cover"
              onError={e => {
                (e.currentTarget as HTMLImageElement).src = fallbackSrc;
              }}
            />
          </div>

          {/* Info */}
          <div className="flex flex-col gap-1 min-w-0">
            <span
              className="text-base font-bold leading-tight truncate"
              style={{ color: t.resultNameText }}
            >
              {teacher.full_name}
            </span>
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className="text-xs font-mono font-semibold px-2 py-0.5 rounded-md"
                style={{
                  background: t.badgeBg,
                  color: t.badgeText,
                  border: `1px solid ${t.badgeBorder}`,
                }}
              >
                {teacher.emp_no}
              </span>
              {teacher.department && (
                <span className="text-xs truncate" style={{ color: t.cellMuted }}>
                  {teacher.department}
                </span>
              )}
            </div>
          </div>

          {/* Permission count badge */}
          <div className="ml-auto shrink-0 text-right">
            <span
              className="text-xs font-semibold px-2.5 py-1 rounded-full"
              style={{
                background: t.pillBg,
                color: t.pillText,
                border: `1px solid ${t.pillBorder}`,
              }}
            >
              {totalGranted} granted
            </span>
            <p className="text-xs mt-0.5" style={{ color: t.emptyText }}>
              across {selectedDepts.length} dept(s)
            </p>
          </div>
        </div>

        {/* ── Assign Department / Section (multi-select) ── */}
        <div
          className="px-6 py-3 shrink-0"
          style={{ borderBottom: `1px solid ${t.dividerColor}` }}
        >
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-bold uppercase tracking-widest" style={{ color: t.tableHeadText }}>
              Assigned Department / Section
            </p>
            {selectedDepts.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  selectedDepts.forEach(removeDept);
                }}
                className="text-xs font-medium transition-all duration-150"
                style={{ color: t.cellMuted }}
                onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = t.resultMetaText)}
                onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = t.cellMuted)}
              >
                Clear all
              </button>
            )}
          </div>

          {/* Trigger button */}
          <button
            type="button"
            onClick={() => setDeptPickerOpen((prev) => !prev)}
            className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-sm transition-all duration-150"
            style={{
              background: t.inputBg,
              border: `1px solid ${errors.departments ? '#f87171' : (deptPickerOpen ? t.inputBorderFocus : t.inputBorder)}`,
              color: t.inputPlaceholder,
              borderRadius: deptPickerOpen ? '0.75rem 0.75rem 0 0' : '0.75rem',
            }}
          >
            <span className="text-sm">
              {selectedDepts.length === 0
                ? 'Select departments or sections…'
                : `Add more…`}
            </span>
            {deptPickerOpen
              ? <ChevronUp className="w-4 h-4 shrink-0" style={{ color: t.cellMuted }} />
              : <ChevronDown className="w-4 h-4 shrink-0" style={{ color: t.cellMuted }} />
            }
          </button>

          {errors.departments && (
            <p className="flex items-center gap-1 mt-1.5 text-xs font-medium" style={{ color: '#f87171' }}>
              <AlertCircle className="w-3 h-3 shrink-0" />
              {errors.departments}
            </p>
          )}

          {/* Dropdown list */}
          {deptPickerOpen && (
            <div
              style={{
                background: t.inputBg,
                border: `1px solid ${t.inputBorder}`,
                borderTop: 'none',
                borderRadius: '0 0 0.75rem 0.75rem',
                maxHeight: '200px',
                overflowY: 'auto',
              }}
            >
              {/* Search inside dropdown */}
              <div className="px-3 py-2" style={{ borderBottom: `1px solid ${t.dividerColor}` }}>
                <div className="relative">
                  <Search
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none"
                    style={{ color: t.inputPlaceholder }}
                  />
                  <input
                    type="text"
                    value={deptSearch}
                    onChange={(e) => setDeptSearch(e.target.value)}
                    placeholder="Search…"
                    className="w-full pl-8 pr-3 py-1.5 rounded-lg text-xs outline-none transition-all duration-150"
                    style={{
                      background: t.resultRowBg,
                      border: `1px solid ${t.inputBorder}`,
                      color: t.inputText,
                    }}
                    onFocus={e => ((e.currentTarget as HTMLElement).style.borderColor = t.inputBorderFocus)}
                    onBlur={e => ((e.currentTarget as HTMLElement).style.borderColor = t.inputBorder)}
                  />
                </div>
              </div>

              {filteredList.length === 0 ? (
                <div className="flex items-center justify-center py-6">
                  <span className="text-xs" style={{ color: t.emptyText }}>No results found.</span>
                </div>
              ) : (
                filteredList.map((item, idx) => {
                  const isSelected = selectedDepts.some((d) => d.id === item.id && d.kind === item.kind);
                  const isDept = item.kind === 'Department';
                  return (
                    <div
                      key={`${item.kind}-${item.id}`}
                      onClick={() => {
                        if (isSelected) removeDept(item); else addDept(item);
                      }}
                      className="flex items-center gap-2.5 px-4 py-2.5 cursor-pointer transition-all duration-150"
                      style={{
                        background: isSelected
                          ? (isDark ? 'rgba(37,99,235,0.18)' : 'rgba(219,234,254,0.80)')
                          : 'transparent',
                        borderBottom: idx < filteredList.length - 1 ? `1px solid ${t.resultRowBorder}` : 'none',
                      }}
                      onMouseEnter={e => {
                        if (!isSelected) (e.currentTarget as HTMLElement).style.background = t.resultRowHover;
                      }}
                      onMouseLeave={e => {
                        if (!isSelected) (e.currentTarget as HTMLElement).style.background = 'transparent';
                      }}
                    >
                      {/* Checkbox indicator */}
                      <div
                        className="w-4 h-4 rounded flex items-center justify-center shrink-0 transition-all duration-150"
                        style={{
                          background: isSelected ? t.checkboxAccent : 'transparent',
                          border: `2px solid ${isSelected ? t.checkboxAccent : t.inputBorder}`,
                        }}
                      >
                        {isSelected && (
                          <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                            <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </div>

                      {isDept
                        ? <Building2 className="w-3.5 h-3.5 shrink-0" style={{ color: isDark ? '#93c5fd' : '#1d4ed8' }} />
                        : <Layers className="w-3.5 h-3.5 shrink-0" style={{ color: isDark ? '#6ee7b7' : '#047857' }} />
                      }
                      <span className="text-sm flex-1 truncate" style={{ color: t.resultNameText, fontWeight: isSelected ? 600 : 400 }}>
                        {item.name}
                      </span>
                      <span
                        className="shrink-0 text-xs font-semibold px-1.5 py-0.5 rounded-md"
                        style={{
                          background: isDept
                            ? (isDark ? 'rgba(37,99,235,0.25)' : 'rgba(37,99,235,0.10)')
                            : (isDark ? 'rgba(16,185,129,0.20)' : 'rgba(16,185,129,0.10)'),
                          color: isDept
                            ? (isDark ? '#93c5fd' : '#1d4ed8')
                            : (isDark ? '#6ee7b7' : '#047857'),
                          border: `1px solid ${isDept
                            ? (isDark ? 'rgba(99,155,255,0.30)' : 'rgba(37,99,235,0.20)')
                            : (isDark ? 'rgba(52,211,153,0.30)' : 'rgba(16,185,129,0.20)')}`,
                        }}
                      >
                        {item.kind}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* ── Per-Dept Permission Cards ── */}
        <div className="overflow-y-auto flex-1 px-6 py-3 space-y-3">
          {selectedDepts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 gap-2">
              <Building2 className="w-5 h-5" style={{ color: t.emptyText }} />
              <span className="text-xs text-center" style={{ color: t.emptyText }}>
                Add a department or section above to configure permissions.
              </span>
            </div>
          ) : (
            selectedDepts.map((dept) => {
              const key = deptKey(dept);
              const isDept = dept.kind === 'Department';
              const isCollapsed = collapsedDepts[key] ?? false;
              const checkedCount = deptCheckedCount(key);
              const allOn = deptAllChecked(key);
              const someOn = deptSomeChecked(key);
              const permMap = deptPerms[key] ?? {};
              const isProposalOn = proposalPermId !== undefined && !!permMap[proposalPermId];
              const permError = errors[`dept_${key}_permissions`];
              const fromError = errors[`dept_${key}_proposal_from`];
              const toError = errors[`dept_${key}_proposal_to`];

              return (
                <div
                  key={key}
                  className="rounded-xl overflow-hidden"
                  style={{
                    border: `1px solid ${permError
                      ? '#f87171'
                      : isDept
                        ? (isDark ? 'rgba(99,155,255,0.30)' : 'rgba(37,99,235,0.25)')
                        : (isDark ? 'rgba(52,211,153,0.30)' : 'rgba(16,185,129,0.25)')}`,
                  }}
                >
                  {/* Dept card header */}
                  <div
                    className="flex items-center gap-2.5 px-4 py-2.5 cursor-pointer select-none"
                    style={{
                      background: isDept
                        ? (isDark ? 'rgba(37,99,235,0.18)' : 'rgba(219,234,254,0.70)')
                        : (isDark ? 'rgba(16,185,129,0.15)' : 'rgba(209,250,229,0.70)'),
                      borderBottom: isCollapsed ? 'none' : `1px solid ${isDept
                        ? (isDark ? 'rgba(99,155,255,0.20)' : 'rgba(37,99,235,0.15)')
                        : (isDark ? 'rgba(52,211,153,0.20)' : 'rgba(16,185,129,0.15)')}`,
                    }}
                    onClick={() => setCollapsedDepts((prev) => ({ ...prev, [key]: !isCollapsed }))}
                  >
                    {isDept
                      ? <Building2 className="w-3.5 h-3.5 shrink-0" style={{ color: isDark ? '#93c5fd' : '#1d4ed8' }} />
                      : <Layers className="w-3.5 h-3.5 shrink-0" style={{ color: isDark ? '#6ee7b7' : '#047857' }} />
                    }
                    <span
                      className="text-sm font-semibold flex-1 truncate"
                      style={{ color: isDept ? (isDark ? '#93c5fd' : '#1d4ed8') : (isDark ? '#6ee7b7' : '#047857') }}
                    >
                      {dept.name}
                    </span>
                    <span
                      className="text-xs font-semibold px-1.5 py-0.5 rounded-md shrink-0"
                      style={{
                        background: isDept
                          ? (isDark ? 'rgba(37,99,235,0.25)' : 'rgba(37,99,235,0.10)')
                          : (isDark ? 'rgba(16,185,129,0.20)' : 'rgba(16,185,129,0.10)'),
                        color: isDept ? (isDark ? '#93c5fd' : '#1d4ed8') : (isDark ? '#6ee7b7' : '#047857'),
                      }}
                    >
                      {checkedCount}/{permissions.length}
                    </span>
                    {/* Remove dept */}
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); removeDept(dept); }}
                      className="ml-1 w-5 h-5 flex items-center justify-center rounded-full opacity-60 hover:opacity-100 transition-opacity"
                      style={{ color: t.cellMuted }}
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                    {isCollapsed
                      ? <ChevronDown className="w-4 h-4 shrink-0" style={{ color: t.cellMuted }} />
                      : <ChevronUp className="w-4 h-4 shrink-0" style={{ color: t.cellMuted }} />
                    }
                  </div>

                  {/* Per-dept permissions list */}
                  {!isCollapsed && (
                    <div style={{ background: t.permRowBg }}>
                      {/* Select-all row */}
                      <div
                        className="flex items-center justify-between px-4 py-2"
                        style={{ borderBottom: `1px solid ${t.permRowBorder}` }}
                      >
                        {permError && (
                          <span className="flex items-center gap-1 text-xs font-medium" style={{ color: '#f87171' }}>
                            <AlertCircle className="w-3 h-3" />
                            {permError}
                          </span>
                        )}
                        {!permError && (
                          <span className="text-xs font-bold uppercase tracking-widest" style={{ color: t.tableHeadText }}>
                            Permissions
                          </span>
                        )}
                        <label className="flex items-center gap-2 cursor-pointer select-none ml-auto">
                          <span className="text-xs font-medium" style={{ color: t.cellMuted }}>
                            {allOn ? 'Deselect All' : 'Select All'}
                          </span>
                          <div className="relative flex items-center">
                            <input type="checkbox" checked={allOn} onChange={() => toggleAllDeptPerms(key)} className="sr-only"
                              ref={el => { if (el) el.indeterminate = someOn; }} />
                            <div
                              className="w-4 h-4 rounded flex items-center justify-center cursor-pointer transition-all duration-150"
                              style={{
                                background: allOn || someOn ? t.checkboxAccent : 'transparent',
                                border: `2px solid ${allOn || someOn ? t.checkboxAccent : t.inputBorder}`,
                              }}
                            >
                              {allOn && (
                                <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                                  <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                              )}
                              {someOn && (
                                <svg width="8" height="2" viewBox="0 0 8 2" fill="none">
                                  <path d="M1 1H7" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
                                </svg>
                              )}
                            </div>
                          </div>
                        </label>
                      </div>

                      {/* Permission rows */}
                      <div className="px-4 py-2 space-y-1.5">
                        {permissions.length === 0 ? (
                          <div className="flex items-center justify-center py-6 gap-2">
                            <ShieldCheck className="w-4 h-4" style={{ color: t.emptyText }} />
                            <span className="text-xs" style={{ color: t.emptyText }}>No permissions available.</span>
                          </div>
                        ) : (
                          permissions.map((permission) => {
                            const isChecked = !!permMap[permission.id];
                            const displayLabel = permission.label ?? permission.name;
                            const isProposal = permission.name === 'allow-budget-proposal-entry';

                            return (
                              <div key={permission.id} className="flex flex-col gap-0">
                                <label
                                  className="flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all duration-150"
                                  style={{
                                    background: isChecked
                                      ? (isDark ? 'rgba(37, 99, 235, 0.12)' : 'rgba(219, 234, 254, 0.60)')
                                      : 'transparent',
                                    border: `1px solid ${isChecked ? (isDark ? 'rgba(99,155,255,0.25)' : 'rgba(37,99,235,0.20)') : 'transparent'}`,
                                    borderRadius: isProposal && isChecked ? '0.75rem 0.75rem 0 0' : '0.75rem',
                                  }}
                                  onMouseEnter={e =>
                                    !isChecked && ((e.currentTarget as HTMLElement).style.background = t.permRowHover)
                                  }
                                  onMouseLeave={e =>
                                    !isChecked && ((e.currentTarget as HTMLElement).style.background = 'transparent')
                                  }
                                >
                                  <div className="relative shrink-0 flex items-center">
                                    <input type="checkbox" checked={isChecked} onChange={() => toggleDeptPerm(key, permission.id)} className="sr-only" />
                                    <div
                                      className="w-4 h-4 rounded flex items-center justify-center transition-all duration-150"
                                      style={{
                                        background: isChecked ? t.checkboxAccent : 'transparent',
                                        border: `2px solid ${isChecked ? t.checkboxAccent : t.inputBorder}`,
                                      }}
                                    >
                                      {isChecked && (
                                        <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                                          <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                      )}
                                    </div>
                                  </div>
                                  <span className="text-sm flex-1 leading-snug" style={{ color: isChecked ? t.resultMetaText : t.resultNameText, fontWeight: isChecked ? 600 : 400 }}>
                                    {displayLabel}
                                  </span>
                                  {isChecked && (
                                    <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: t.checkboxAccent }} />
                                  )}
                                </label>

                                {/* Proposal date range per dept */}
                                {isProposal && isChecked && (
                                  <div
                                    className="px-4 py-4 flex flex-col gap-3"
                                    style={{
                                      background: isDark ? 'rgba(37, 99, 235, 0.08)' : 'rgba(219, 234, 254, 0.40)',
                                      border: `1px solid ${isDark ? 'rgba(99,155,255,0.25)' : 'rgba(37,99,235,0.20)'}`,
                                      borderTop: 'none',
                                      borderRadius: '0 0 0.75rem 0.75rem',
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: t.tableHeadText }}>
                                      Proposal Entry Period
                                    </p>
                                    <div className="grid grid-cols-2 gap-3">
                                      <div className="flex flex-col gap-1.5">
                                        <label className="text-xs font-medium" style={{ color: t.cellMuted }}>From</label>
                                        <input
                                          type="date"
                                          value={deptProposalFrom[key] ?? ''}
                                          onChange={(e) => {
                                            const v = e.target.value;
                                            setDeptProposalFrom((prev) => ({ ...prev, [key]: v }));
                                            setErrors((prev) => ({ ...prev, [`dept_${key}_proposal_from`]: undefined }));
                                          }}
                                          className="w-full px-3 py-2 rounded-lg text-xs outline-none transition-all duration-150"
                                          style={{
                                            background: t.inputBg,
                                            border: `1px solid ${fromError ? '#f87171' : t.inputBorder}`,
                                            color: t.inputText,
                                            colorScheme: isDark ? 'dark' : 'light',
                                          }}
                                          onFocus={e => ((e.currentTarget as HTMLElement).style.borderColor = fromError ? '#f87171' : t.inputBorderFocus)}
                                          onBlur={e => ((e.currentTarget as HTMLElement).style.borderColor = fromError ? '#f87171' : t.inputBorder)}
                                        />
                                        {fromError && (
                                          <p className="flex items-center gap-1 text-xs font-medium" style={{ color: '#f87171' }}>
                                            <AlertCircle className="w-3 h-3 shrink-0" />{fromError}
                                          </p>
                                        )}
                                      </div>
                                      <div className="flex flex-col gap-1.5">
                                        <label className="text-xs font-medium" style={{ color: t.cellMuted }}>To</label>
                                        <input
                                          type="date"
                                          value={deptProposalTo[key] ?? ''}
                                          min={deptProposalFrom[key] || undefined}
                                          onChange={(e) => {
                                            const v = e.target.value;
                                            setDeptProposalTo((prev) => ({ ...prev, [key]: v }));
                                            setErrors((prev) => ({ ...prev, [`dept_${key}_proposal_to`]: undefined }));
                                          }}
                                          className="w-full px-3 py-2 rounded-lg text-xs outline-none transition-all duration-150"
                                          style={{
                                            background: t.inputBg,
                                            border: `1px solid ${toError ? '#f87171' : t.inputBorder}`,
                                            color: t.inputText,
                                            colorScheme: isDark ? 'dark' : 'light',
                                          }}
                                          onFocus={e => ((e.currentTarget as HTMLElement).style.borderColor = toError ? '#f87171' : t.inputBorderFocus)}
                                          onBlur={e => ((e.currentTarget as HTMLElement).style.borderColor = toError ? '#f87171' : t.inputBorder)}
                                        />
                                        {toError && (
                                          <p className="flex items-center gap-1 text-xs font-medium" style={{ color: '#f87171' }}>
                                            <AlertCircle className="w-3 h-3 shrink-0" />{toError}
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* ── Footer ── */}
        <div
          className="px-6 py-4 flex items-center justify-between gap-3 shrink-0"
          style={{ borderTop: `1px solid ${t.dividerColor}` }}
        >
          <div>
            {existingAccess && existingAccess.length > 0 && (
              <button
                onClick={handleRemoveAll}
                disabled={isRemoving || isSaving}
                className="flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-lg transition-all duration-150"
                style={{
                  background: isDark ? 'rgba(239,68,68,0.15)' : 'rgba(254,242,242,0.90)',
                  color: isDark ? '#f87171' : '#dc2626',
                  border: `1px solid ${isDark ? 'rgba(239,68,68,0.35)' : 'rgba(239,68,68,0.30)'}`,
                  opacity: isRemoving || isSaving ? 0.6 : 1,
                  cursor: isRemoving || isSaving ? 'not-allowed' : 'pointer',
                }}
              >
                {isRemoving
                  ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  : <X className="w-3.5 h-3.5" />
                }
                {isRemoving ? 'Removing…' : 'Remove All Access'}
              </button>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              disabled={isSaving}
              className="text-xs font-semibold px-4 py-2 rounded-lg transition-all duration-150"
              style={{
                background: t.backBtnBg,
                color: t.backBtnText,
                border: `1px solid ${t.backBtnBorder}`,
              }}
              onMouseEnter={e =>
                ((e.currentTarget as HTMLElement).style.background = t.backBtnHoverBg)
              }
              onMouseLeave={e =>
                ((e.currentTarget as HTMLElement).style.background = t.backBtnBg)
              }
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-lg transition-all duration-150"
              style={{
                background: isSaving ? (isDark ? 'rgba(37,99,235,0.50)' : 'rgba(37,99,235,0.60)') : t.saveBtnBg,
                color: t.saveBtnText,
                border: `1px solid ${t.saveBtnBorder}`,
                boxShadow: t.saveBtnShadow,
                opacity: isSaving ? 0.75 : 1,
                cursor: isSaving ? 'not-allowed' : 'pointer',
              }}
              onMouseEnter={e => {
                if (!isSaving) (e.currentTarget as HTMLElement).style.background = t.saveBtnHoverBg;
              }}
              onMouseLeave={e => {
                if (!isSaving) (e.currentTarget as HTMLElement).style.background = t.saveBtnBg;
              }}
            >
              {isSaving
                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                : <Save className="w-3.5 h-3.5" />
              }
              {isSaving ? 'Saving…' : 'Save Access'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Add User Modal
// ─────────────────────────────────────────────────────────────────────────────
function AddUserModal({
  isOpen,
  onClose,
  isDark,
  permissions,
  deptData,
  onToast,
  onUserSaved,

}: {
  isOpen: boolean;
  onClose: () => void;
  isDark: boolean;
  permissions: Permission[];
  deptData: DeptData | null;
  onToast: (type: 'success' | 'error', message: string) => void;
  onUserSaved?: () => void;
}) {
  const t = isDark ? T.dark : T.light;
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Teacher[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // User Management Modal state
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [isMgmtOpen, setIsMgmtOpen] = useState(false);
  const [isFetchingAccess, setIsFetchingAccess] = useState(false);
  const [existingAccess, setExistingAccess] = useState<ExistingAccessEntry[] | null>(null);


  // Focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setQuery('');
      setResults([]);
      setHasSearched(false);
      setSelectedTeacher(null);
      setIsMgmtOpen(false);
    }
  }, [isOpen]);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (query.trim().length < 2) {
      setResults([]);
      setHasSearched(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setIsLoading(true);
      setHasSearched(true);
      try {
        const { data } = await financeSvc.get('/abms/access/users/search', {
          params: { q: query.trim() },
        });
        setResults(data.data ?? []);
      } catch {
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 400);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  const handleRowClick = async (teacher: Teacher) => {
    setSelectedTeacher(teacher);
    setIsFetchingAccess(true);
    try {
      const { data } = await financeSvc.get(`/abms/access/users/${teacher.emp_no}`);
      setExistingAccess(data.data ?? null);
    } catch {
      setExistingAccess(null);
    } finally {
      setIsFetchingAccess(false);
      setIsMgmtOpen(true);
    }
  };

  const handleMgmtClose = () => {
    setIsMgmtOpen(false);
    setSelectedTeacher(null);
    onClose();
  };

  const handleMgmtBack = () => {
    setIsMgmtOpen(false);
    setSelectedTeacher(null);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* ── User Management Modal (layered on top) ── */}
      <UserManagementModal
        isOpen={isMgmtOpen}
        onClose={handleMgmtClose}
        onBack={handleMgmtBack}
        teacher={selectedTeacher}
        permissions={permissions}
        deptData={deptData}
        isDark={isDark}
        onToast={onToast}
        onUserSaved={onUserSaved}
        existingAccess={existingAccess}
      />

      {/* ── Add User Search Modal ── */}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ background: t.modalOverlay, backdropFilter: 'blur(4px)' }}
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <div
          className="w-full max-w-lg rounded-2xl overflow-hidden"
          style={{
            background: t.modalBg,
            border: `1px solid ${t.modalBorder}`,
            boxShadow: t.modalShadow,
          }}
        >
          {/* ── Modal Header ── */}
          <div
            className="flex items-center justify-between px-6 py-4"
            style={{ borderBottom: `1px solid ${t.dividerColor}` }}
          >
            <div className="flex items-center gap-2">
              <UserPlus className="w-4 h-4" style={{ color: t.resultMetaText }} />
              <span
                className="text-sm font-semibold tracking-wide"
                style={{ color: t.resultNameText }}
              >
                Add User Access
              </span>
            </div>
            <button
              onClick={onClose}
              className="w-7 h-7 flex items-center justify-center rounded-lg transition-all duration-150"
              style={{
                color: t.cellMuted,
                background: 'transparent',
              }}
              onMouseEnter={e =>
                ((e.currentTarget as HTMLElement).style.background = t.resultRowHover)
              }
              onMouseLeave={e =>
                ((e.currentTarget as HTMLElement).style.background = 'transparent')
              }
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* ── Search Input ── */}
          <div className="px-6 py-4">
            <p className="text-xs mb-3" style={{ color: t.cellMuted }}>
              Search by employee number or full name to find a user.
            </p>
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
                style={{ color: t.inputPlaceholder }}
              />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="e.g. 2019-00123 or Juan Dela Cruz"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none transition-all duration-150"
                style={{
                  background: t.inputBg,
                  border: `1px solid ${t.inputBorder}`,
                  color: t.inputText,
                }}
                onFocus={e =>
                  ((e.currentTarget as HTMLElement).style.borderColor = t.inputBorderFocus)
                }
                onBlur={e =>
                  ((e.currentTarget as HTMLElement).style.borderColor = t.inputBorder)
                }
              />
              {isLoading && (
                <Loader2
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin"
                  style={{ color: t.resultMetaText }}
                />
              )}
            </div>
          </div>

          {/* ── Results ── */}
          <div
            className="mx-6 mb-6 rounded-xl overflow-hidden"
            style={{
              border: hasSearched || results.length > 0
                ? `1px solid ${t.resultRowBorder}`
                : 'none',
              minHeight: hasSearched ? '120px' : 'auto',
              maxHeight: '280px',
              overflowY: 'auto',
            }}
          >
            {/* Loading state */}
            {isLoading && (
              <div
                className="flex flex-col items-center justify-center py-10 gap-2"
                style={{ background: t.resultRowBg }}
              >
                <Loader2
                  className="w-5 h-5 animate-spin"
                  style={{ color: t.resultMetaText }}
                />
                <span className="text-xs" style={{ color: t.emptyText }}>
                  Searching...
                </span>
              </div>
            )}

            {/* Empty state */}
            {!isLoading && hasSearched && results.length === 0 && (
              <div
                className="flex flex-col items-center justify-center py-10 gap-2"
                style={{ background: t.resultRowBg }}
              >
                <Users className="w-5 h-5" style={{ color: t.emptyText }} />
                <span className="text-xs" style={{ color: t.emptyText }}>
                  No users found for "{query}"
                </span>
              </div>
            )}

            {/* Results list */}
            {!isLoading && results.length > 0 && (
              <div style={{ background: t.resultRowBg }}>
                {results.map((teacher, idx) => (
                  <div
                    key={teacher.emp_no}
                    className="flex items-center justify-between px-4 py-3 transition-all duration-150 cursor-pointer"
                    style={{
                      borderBottom:
                        idx < results.length - 1
                          ? `1px solid ${t.resultRowBorder}`
                          : 'none',
                    }}
                    onClick={() => !isFetchingAccess && handleRowClick(teacher)}
                    onMouseEnter={e =>
                      ((e.currentTarget as HTMLElement).style.background = t.resultRowHover)
                    }
                    onMouseLeave={e =>
                      ((e.currentTarget as HTMLElement).style.background = 'transparent')
                    }
                  >
                    {/* Avatar */}
                    <img
                      src={`https://live.adamson.edu.ph/legacy/primarypicavatar/getuserimg_idno.php?x=${teacher.emp_no}_2`}
                      alt={teacher.full_name}
                      className="w-9 h-9 rounded-full object-cover shrink-0 mr-3"
                      style={{ border: `1.5px solid ${t.resultRowBorder}` }}
                      onError={e => {
                        (e.currentTarget as HTMLImageElement).src =
                          `https://ui-avatars.com/api/?name=${encodeURIComponent(teacher.full_name)}&background=2563eb&color=fff&size=64`;
                      }}
                    />

                    {/* Info */}
                    <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                      <span
                        className="text-sm font-medium"
                        style={{ color: t.resultNameText }}
                      >
                        {teacher.full_name}
                      </span>
                      <span
                        className="text-xs font-mono"
                        style={{ color: t.resultMetaText }}
                      >
                        {teacher.emp_no}
                      </span>
                      {teacher.department && (
                        <span className="text-xs truncate" style={{ color: t.cellMuted }}>
                          {teacher.department}
                        </span>
                      )}
                    </div>

                    {/* Manage button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRowClick(teacher);
                      }}
                      className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg shrink-0 transition-all duration-150"
                      style={{
                        background: t.selectBtnBg,
                        color: t.selectBtnText,
                        border: `1px solid ${t.selectBtnBorder}`,
                        opacity: isFetchingAccess ? 0.6 : 1,
                        cursor: isFetchingAccess ? 'not-allowed' : 'pointer',
                      }}
                      disabled={isFetchingAccess}
                      onMouseEnter={e =>
                        ((e.currentTarget as HTMLElement).style.background = t.selectBtnHoverBg)
                      }
                      onMouseLeave={e =>
                        ((e.currentTarget as HTMLElement).style.background = t.selectBtnBg)
                      }
                    >
                      {isFetchingAccess && selectedTeacher?.emp_no === teacher.emp_no
                        ? <Loader2 className="w-3.5 h-3.5 animate-spin" style={{ color: t.resultMetaText }} />
                        : <UserCheck className="w-3.5 h-3.5" />
                      }
                      Manage Access
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Prompt state — not yet searched */}
            {!isLoading && !hasSearched && (
              <div />
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────
export default function UserAccess() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastData[]>([]);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserAccessRecord | null>(null);
  const [isFetchingRowAccess, setIsFetchingRowAccess] = useState(false);
  const [rowExistingAccess, setRowExistingAccess] = useState<ExistingAccessEntry[] | null>(null);

  const handleRowEdit = async (user: UserAccessRecord) => {
    setEditingUser(user);
    setIsFetchingRowAccess(true);
    try {
      const { data } = await financeSvc.get(`/abms/access/users/${user.emp_no}`);
      setRowExistingAccess(data.data ?? null);
    } catch {
      setRowExistingAccess(null);
    } finally {
      setIsFetchingRowAccess(false);
      setIsEditModalOpen(true);
    }
  };

  const raw = userdepartmentRoute.useLoaderData();
  const permissions: Permission[] = raw?.data?.permissions ?? [];
  const deptData: DeptData | null = raw?.departments ?? null;

  const [users, setUsers] = useState<UserAccessRecord[]>(raw?.users?.data ?? []);
  const [nextCursor, setNextCursor] = useState<string | null>(raw?.users?.next_cursor ?? null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const showToast = (type: 'success' | 'error', message: string) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, type, message }]);
  };

  const dismissToast = (id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const loadMore = async () => {
    if (!nextCursor || isLoadingMore) return;
    setIsLoadingMore(true);
    try {
      const { data } = await financeSvc.get(`/abms/access/users?cursor=${nextCursor}`);
      setUsers((prev) => [...prev, ...(data.data ?? [])]);
      setNextCursor(data.next_cursor ?? null);
    } catch (err) {
      console.error('Failed to load more users:', err);
      showToast('error', 'Failed to load more users.');
    } finally {
      setIsLoadingMore(false);
    }
  };

  const refetchUsers = async () => {
    try {
      const { data } = await financeSvc.get('/abms/access');
      setUsers(data.data ?? []);
      setNextCursor(data.next_cursor ?? null);
    } catch (err) {
      console.error('Failed to refetch users:', err);
    }
  };

  return (
    <AdamsonBudgetLayout>
      {(isDark: boolean) => {
        const t = isDark ? T.dark : T.light;

        return (
          <div className="max-w-6xl mx-auto space-y-6">

            {/* ── Toast Container ────────────────────────────── */}
            <ToastContainer toasts={toasts} isDark={isDark} onDismiss={dismissToast} />

            {/* ── Add User Modal ─────────────────────────────── */}
            <AddUserModal
              isOpen={isModalOpen}
              onClose={() => setIsModalOpen(false)}
              isDark={isDark}
              permissions={permissions}
              deptData={deptData}
              onToast={showToast}
              onUserSaved={refetchUsers}
            />

            {/* ── Row Edit Modal ─────────────────────────────── */}
            <UserManagementModal
              isOpen={isEditModalOpen}
              onClose={() => { setIsEditModalOpen(false); setEditingUser(null); }}
              onBack={() => { setIsEditModalOpen(false); setEditingUser(null); }}
              teacher={editingUser ? {
                emp_no: editingUser.emp_no,
                full_name: editingUser.full_name,
                lname: '', fname: '', mname: '',
              } : null}
              permissions={permissions}
              deptData={deptData}
              isDark={isDark}
              onToast={showToast}
              onUserSaved={refetchUsers}
              existingAccess={rowExistingAccess}
            />

            {/* ── Page header ─────────────────────────────────── */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1
                  className="text-2xl font-bold tracking-tight"
                  style={{ color: t.titleColor }}
                >
                  User Department Access
                </h1>
                <p className="text-sm mt-0.5" style={{ color: t.subColor }}>
                  Users and their assigned department or office.
                </p>
              </div>

              {/* ── Add User button ──────────────────────────── */}
              <button
                className="flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-lg shrink-0 transition-all duration-150"
                style={{
                  background: t.addBtnBg,
                  color: t.addBtnText,
                  border: `1px solid ${t.addBtnBorder}`,
                  boxShadow: t.addBtnShadow,
                }}
                onMouseEnter={e =>
                  ((e.currentTarget as HTMLButtonElement).style.background = t.addBtnHoverBg)
                }
                onMouseLeave={e =>
                  ((e.currentTarget as HTMLButtonElement).style.background = t.addBtnBg)
                }
                onClick={() => setIsModalOpen(true)}
              >
                <UserPlus className="w-4 h-4" />
                Add User
              </button>
            </div>

            {/* ── Card ────────────────────────────────────────── */}
            <Card
              className="overflow-hidden backdrop-blur-sm"
              style={{
                background: t.cardBg,
                border: `1px solid ${t.cardBorder}`,
                boxShadow: t.cardShadow,
              }}
            >
              <CardHeader
                className="px-6 py-4 flex flex-row items-center gap-2"
                style={{ borderBottom: `1px solid ${t.cardHeaderBorder}` }}
              >
                <Users className="w-4 h-4" style={{ color: t.tableHeadText }} />
                <CardTitle
                  className="text-sm font-semibold tracking-wide"
                  style={{ color: t.cardTitleColor }}
                >
                  User Access List
                </CardTitle>
                <span
                  className="ml-auto text-xs font-medium px-2 py-0.5 rounded-full"
                  style={{
                    background: t.pillBg,
                    color: t.pillText,
                    border: `1px solid ${t.pillBorder}`,
                  }}
                >
                  {users.length} record{users.length !== 1 ? 's' : ''}
                </span>
              </CardHeader>

              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow
                      style={{
                        background: t.tableHeadBg,
                        borderBottom: `1px solid ${t.tableHeadBorder}`,
                      }}
                    >
                      {['Employee', 'Assigned Department / Office'].map(col => (
                        <TableHead
                          key={col}
                          className="text-xs font-bold uppercase tracking-widest h-10 px-6"
                          style={{ color: t.tableHeadText }}
                        >
                          {col}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {users.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={2}
                          className="py-10 text-center text-sm"
                          style={{ color: t.cellMuted }}
                        >
                          No users found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      users.map((user: UserAccessRecord) => (
                        <TableRow
                          key={`user-${user.emp_no}`}
                          className="transition-colors duration-150"
                          style={{
                            borderBottom: `1px solid ${t.rowBorder}`,
                            cursor: isFetchingRowAccess && editingUser?.emp_no === user.emp_no ? 'wait' : 'pointer',
                          }}
                          onClick={() => handleRowEdit(user)}
                          onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = t.rowHoverBg)}
                          onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
                        >
                          {/* Employee info */}
                          <TableCell className="px-6 py-3">
                            <div className="flex items-center gap-3">
                              <img
                                src={`https://live.adamson.edu.ph/legacy/primarypicavatar/getuserimg_idno.php?x=${user.emp_no}_2`}
                                alt={user.full_name}
                                className="w-8 h-8 rounded-full object-cover shrink-0"
                                style={{ border: `1.5px solid ${t.rowBorder}` }}
                                onError={e => {
                                  (e.currentTarget as HTMLImageElement).src =
                                    `https://ui-avatars.com/api/?name=${encodeURIComponent(user.full_name)}&background=2563eb&color=fff&size=64`;
                                }}
                              />
                              <div className="flex flex-col gap-0.5 min-w-0">
                                <span className="text-sm font-medium truncate" style={{ color: t.cellText }}>
                                  {user?.full_name ?? '—'}
                                </span>
                                <span className="text-xs font-mono" style={{ color: t.cellMuted }}>
                                  {user.emp_no}
                                </span>
                              </div>
                            </div>
                          </TableCell>
                          {/* Departments / Sections */}
                          <TableCell className="px-6 py-3">
                            <div className="flex flex-wrap gap-1.5">
                              {(user.departments ?? []).map((dept) => {
                                const match = dept.kind === 'Department'
                                  ? deptData?.departments.find((d) => String(d.id) === String(dept.id))
                                  : deptData?.sections.find((s) => String(s.id) === String(dept.id));
                                const label = match?.name ?? `${dept.kind} #${dept.id}`;

                                return (
                                  <span
                                    key={`${dept.kind}-${dept.id}`}
                                    className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full"
                                    style={{
                                      background: dept.kind === 'Department'
                                        ? t.pillBg
                                        : (isDark ? 'rgba(16,185,129,0.18)' : 'rgba(209,250,229,0.80)'),
                                      color: dept.kind === 'Department'
                                        ? t.pillText
                                        : (isDark ? '#6ee7b7' : '#047857'),
                                      border: `1px solid ${dept.kind === 'Department'
                                        ? t.pillBorder
                                        : (isDark ? 'rgba(52,211,153,0.35)' : 'rgba(16,185,129,0.25)')}`,
                                    }}
                                  >
                                    {dept.kind === 'Department'
                                      ? <Building2 className="w-3 h-3 shrink-0" />
                                      : <Layers className="w-3 h-3 shrink-0" />
                                    }
                                    {label}
                                  </span>
                                );
                              })}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
                {/* ── Load More ── */}
                {nextCursor && (
                  <div
                    className="flex justify-center py-4"
                    style={{ borderTop: `1px solid ${t.rowBorder}` }}
                  >
                    <button
                      onClick={loadMore}
                      disabled={isLoadingMore}
                      className="flex items-center gap-2 text-xs font-semibold px-5 py-2 rounded-lg transition-all duration-150"
                      style={{
                        background: isLoadingMore
                          ? (isDark ? 'rgba(37,99,235,0.40)' : 'rgba(37,99,235,0.50)')
                          : t.addBtnBg,
                        color: t.addBtnText,
                        border: `1px solid ${t.addBtnBorder}`,
                        boxShadow: t.addBtnShadow,
                        cursor: isLoadingMore ? 'not-allowed' : 'pointer',
                        opacity: isLoadingMore ? 0.75 : 1,
                      }}
                      onMouseEnter={e => {
                        if (!isLoadingMore)
                          (e.currentTarget as HTMLElement).style.background = t.addBtnHoverBg;
                      }}
                      onMouseLeave={e => {
                        if (!isLoadingMore)
                          (e.currentTarget as HTMLElement).style.background = t.addBtnBg;
                      }}
                    >
                      {isLoadingMore && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                      {isLoadingMore ? 'Loading…' : 'Load More'}
                    </button>
                  </div>
                )}
              </CardContent>
            </Card>

          </div>
        );
      }}
    </AdamsonBudgetLayout>
  );
}