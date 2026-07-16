import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast, Toaster } from 'sonner';
import AdamsonBudgetLayout from '../../layouts/Screenlayout.tsx';
import {
  Card,
  CardContent,
  CardFooter,
} from '@repo/ui/components/card';
import { Button } from '@repo/ui/components/button';
import { Input } from '@repo/ui/components/input';
import { Label } from '@repo/ui/components/label';
import {
  Pencil,
  Save,
  X,
  CalendarDays,
  Clock,
} from 'lucide-react';
import { budgetsettingsRoute } from '../../router.tsx';
import { financeSvc } from '@repo/axios-config/finance-service';
import { useRouter } from '@tanstack/react-router';
import { PageHeader } from '../../components/ui/Page';

// ── Reusable school year validator ─────────────────────────────────────────
const schoolYearSchema = z
  .string()
  .min(1, 'School year is required')
  .regex(/^\d{4}-\d{4}$/, 'Format must be YYYY-YYYY (e.g. 2025-2026)')
  .refine(
    (val) => {
      const [start, end] = val.split('-').map(Number);
      return end === start + 1;
    },
    { message: 'The second year must be exactly 1 year after the first (e.g. 2025-2026)' }
  );

// ── Schema ──────────────────────────────────────────────────────────────────
const budgetSettingsSchema = z
  .object({
    schoolYear: schoolYearSchema,
    proposalSchoolYear: schoolYearSchema,
    allowFrom: z.string().min(1, 'Start date is required'),
    allowTo: z.string().min(1, 'End date is required'),
  })
  .refine(
    (data) => new Date(data.allowTo) > new Date(data.allowFrom),
    {
      message: '"Allow Entry To" must be after "Allow Entry From"',
      path: ['allowTo'],
    }
  )
  .refine(
    (data) => data.schoolYear !== data.proposalSchoolYear,
    {
      message: 'Proposal school year must be different from school year',
      path: ['proposalSchoolYear'],
    }
  );

type BudgetSettingsFormData = z.infer<typeof budgetSettingsSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// Design tokens — mirrors L.dark / L.light in Screenlayout.tsx
// ─────────────────────────────────────────────────────────────────────────────

const T = {
  dark: {
    // Page header
    titleColor: '#f1f5f9',
    subColor: '#94a3b8',
    // Card
    cardBg: 'rgba(11, 20, 38, 0.70)',
    cardBorder: 'rgba(59, 130, 246, 0.18)',
    cardShadow: '0 4px 32px rgba(37, 99, 235, 0.10)',
    // Card footer
    footerBg: 'rgba(8, 14, 26, 0.60)',
    footerBorder: 'rgba(59, 130, 246, 0.12)',
    // Label
    labelColor: '#22d3ee',   // cyan-400
    // Input
    inputBg: 'rgba(15, 23, 42, 0.90)',
    inputBorder: 'rgba(59, 130, 246, 0.22)',
    inputText: '#e2e8f0',
    inputPlaceholder: '#475569',
    // Cancel button
    cancelColor: '#94a3b8',
    cancelHover: '#e2e8f0',
  },
  light: {
    // Page header
    titleColor: '#00082E',
    subColor: '#2C4A72',
    // Card
    cardBg: 'rgba(240, 247, 255, 0.96)',
    cardBorder: 'rgba(59, 130, 246, 0.26)',
    cardShadow: '0 4px 32px rgba(0, 48, 135, 0.16)',
    // Card footer
    footerBg: 'rgba(210, 228, 255, 0.70)',
    footerBorder: 'rgba(59, 130, 246, 0.22)',
    // Label
    labelColor: '#1740C0',
    // Input
    inputBg: '#ffffff',
    inputBorder: 'rgba(59, 130, 246, 0.32)',
    inputText: '#00082E',
    inputPlaceholder: '#5272A0',
    // Cancel button
    cancelColor: '#2C4A72',
    cancelHover: '#00082E',
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export default function BudgetSettings() {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const { data } = budgetsettingsRoute.useLoaderData();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<BudgetSettingsFormData>({
    resolver: zodResolver(budgetSettingsSchema),
    defaultValues: {
      schoolYear: data.data.current_school_year,
      proposalSchoolYear: data.data.proposal_entry_school_year,
      allowFrom: data.data.allow_entry_from,
      allowTo: data.data.allow_entry_to,
    },
  });

  const onSubmit = async (formData: BudgetSettingsFormData) => {
    try {
      await financeSvc.patch('/abms/budget-settings', {
        current_school_year: formData.schoolYear,
        proposal_entry_school_year: formData.proposalSchoolYear,
        allow_entry_from: formData.allowFrom,
        allow_entry_to: formData.allowTo,
      });
      setIsEditing(false);
      await router.invalidate();
      toast.success('Budget settings saved', {
        description: 'Configuration has been updated successfully.',
      });
    } catch (error: any) {
      toast.error('Failed to save settings', {
        description:
          error?.response?.data?.message ?? 'Please try again or contact support.',
      });
    }
  };

  const handleCancel = () => {
    reset();
    setIsEditing(false);
    toast.info('Edit cancelled', { description: 'No changes were saved.' });
  };

  return (
    // Render-prop pattern: layout exposes isDark so children can theme themselves
    // consistently without relying on Tailwind's dark: variant (which requires
    // a .dark class on <html> — not how this app manages dark mode).
    <AdamsonBudgetLayout>
      {(isDark: boolean) => {
        const t = isDark ? T.dark : T.light;

        return (
          <>
            <Toaster position="bottom-right" richColors closeButton />

            <div className="max-w-7xl mx-auto space-y-6">

              {/* ── Page header ───────────────────────────────────── */}
              <PageHeader
                title="Budget Settings"
                description="Configure budget proposal submission windows."
                actions={!isEditing ? (
                  <Button
                    onClick={() => setIsEditing(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white gap-2 transition-all shadow-lg shadow-blue-600/20"
                  >
                    <Pencil className="w-4 h-4" />
                    Edit Configuration
                  </Button>
                ) : undefined}
              />

              {/* ── Form card ─────────────────────────────────────── */}
              <form onSubmit={handleSubmit(onSubmit)} noValidate>
                <Card
                  className="overflow-hidden backdrop-blur-sm"
                  style={{
                    background: t.cardBg,
                    border: `1px solid ${t.cardBorder}`,
                    boxShadow: t.cardShadow,
                  }}
                >
                  <CardContent className="p-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                      {/* Field 1: School Year */}
                      <div className="space-y-2">
                        <Label
                          htmlFor="schoolYear"
                          className="text-xs font-bold uppercase tracking-widest flex items-center gap-1.5"
                          style={{ color: t.labelColor }}
                        >
                          School Year
                        </Label>
                        <Input
                          id="schoolYear"
                          disabled={!isEditing}
                          placeholder="e.g. 2025-2026"
                          {...register('schoolYear')}
                          style={{
                            background: t.inputBg,
                            border: `1px solid ${t.inputBorder}`,
                            color: t.inputText,
                          }}
                          className="disabled:opacity-80 disabled:cursor-default"
                        />
                        {errors.schoolYear && (
                          <p className="text-xs text-red-500 mt-1">
                            {errors.schoolYear.message}
                          </p>
                        )}
                      </div>

                      {/* Field 2: Proposal Entry School Year */}
                      <div className="space-y-2">
                        <Label
                          htmlFor="proposalSchoolYear"
                          className="text-xs font-bold uppercase tracking-widest"
                          style={{ color: t.labelColor }}
                        >
                          Proposal Entry School Year
                        </Label>
                        <Input
                          id="proposalSchoolYear"
                          disabled={!isEditing}
                          placeholder="e.g. 2025-2026"
                          {...register('proposalSchoolYear')}
                          style={{
                            background: t.inputBg,
                            border: `1px solid ${t.inputBorder}`,
                            color: t.inputText,
                          }}
                          className="disabled:opacity-80 disabled:cursor-default"
                        />
                        {errors.proposalSchoolYear && (
                          <p className="text-xs text-red-500 mt-1">
                            {errors.proposalSchoolYear.message}
                          </p>
                        )}
                      </div>

                      {/* Field 3: Allow Entry From */}
                      <div className="space-y-2">
                        <Label
                          htmlFor="allowFrom"
                          className="text-xs font-bold uppercase tracking-widest flex items-center gap-2"
                          style={{ color: t.labelColor }}
                        >
                          <CalendarDays className="w-3 h-3" /> Allow Entry From
                        </Label>
                        <Input
                          id="allowFrom"
                          type="datetime-local"
                          disabled={!isEditing}
                          {...register('allowFrom')}
                          style={{
                            background: t.inputBg,
                            border: `1px solid ${t.inputBorder}`,
                            color: t.inputText,
                            colorScheme: isDark ? 'dark' : 'light',
                          }}
                          className="disabled:opacity-80 disabled:cursor-default"
                        />
                        {errors.allowFrom && (
                          <p className="text-xs text-red-500 mt-1">
                            {errors.allowFrom.message}
                          </p>
                        )}
                      </div>

                      {/* Field 4: Allow Entry To */}
                      <div className="space-y-2">
                        <Label
                          htmlFor="allowTo"
                          className="text-xs font-bold uppercase tracking-widest flex items-center gap-2"
                          style={{ color: t.labelColor }}
                        >
                          <Clock className="w-3 h-3" /> Allow Entry To
                        </Label>
                        <Input
                          id="allowTo"
                          type="datetime-local"
                          disabled={!isEditing}
                          {...register('allowTo')}
                          style={{
                            background: t.inputBg,
                            border: `1px solid ${t.inputBorder}`,
                            color: t.inputText,
                            colorScheme: isDark ? 'dark' : 'light',
                          }}
                          className="disabled:opacity-80 disabled:cursor-default"
                        />
                        {errors.allowTo && (
                          <p className="text-xs text-red-500 mt-1">
                            {errors.allowTo.message}
                          </p>
                        )}
                      </div>

                    </div>
                  </CardContent>

                  {isEditing && (
                    <CardFooter
                      className="p-4 flex justify-end gap-3"
                      style={{
                        background: t.footerBg,
                        borderTop: `1px solid ${t.footerBorder}`,
                      }}
                    >
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={handleCancel}
                        style={{ color: t.cancelColor }}
                        className="hover:bg-transparent"
                        onMouseEnter={e =>
                          ((e.currentTarget as HTMLElement).style.color = t.cancelHover)
                        }
                        onMouseLeave={e =>
                          ((e.currentTarget as HTMLElement).style.color = t.cancelColor)
                        }
                      >
                        <X className="w-4 h-4 mr-2" />
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-8 shadow-lg shadow-blue-600/20"
                      >
                        <Save className="w-4 h-4 mr-2" />
                        {isSubmitting ? 'Saving…' : 'Save Changes'}
                      </Button>
                    </CardFooter>
                  )}
                </Card>
              </form>

            </div>
          </>
        );
      }}
    </AdamsonBudgetLayout>
  );
}
