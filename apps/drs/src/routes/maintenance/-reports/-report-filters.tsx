import type { ReportCourseOption, ReportFilters } from '@/api/reports.ts';
import { fetchReportCourses } from '@/api/reports.ts';
import { Button } from '@repo/ui/components/button';
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from '@repo/ui/components/combobox';
import { Input } from '@repo/ui/components/input';
import { Label } from '@repo/ui/components/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/ui/components/select';
import { Switch } from '@repo/ui/components/switch';
import { useQuery } from '@tanstack/react-query';
import {
  ReportDatePicker,
  parseReportDate,
  startOfReportDay,
} from './-report-date-picker.tsx';
import {
  REPORT_MONTH_OPTIONS,
  filtersFromMonthYear,
  filtersFromYear,
  monthYearFromFilters,
  reportYearOptions,
  yearFromFilters,
  type ReportPeriodMode,
} from './-report-utils.ts';

type ReportFiltersBarProps = {
  filters: ReportFilters;
  periodMode?: ReportPeriodMode;
  onChange: (filters: ReportFilters) => void;
  onApply: () => void;
  onReset: () => void;
  canReset?: boolean;
  isApplying?: boolean;
};

export function ReportFiltersBar({
  filters,
  periodMode = 'range',
  onChange,
  onApply,
  onReset,
  canReset = false,
  isApplying = false,
}: ReportFiltersBarProps) {
  const coursesQuery = useQuery({
    queryKey: ['drs-report-courses'],
    queryFn: fetchReportCourses,
  });
  const courses = coursesQuery.data ?? [];
  const selectedCourse =
    courses.find((course) => course.id === filters.course_id) ?? null;

  const yearOptions = reportYearOptions();
  const monthYear = monthYearFromFilters(filters);
  const selectedYear =
    periodMode === 'year'
      ? yearFromFilters(filters)
      : (monthYear?.year ?? null);
  const selectedMonth = monthYear?.month ?? null;

  const handleMonthChange = (monthValue: string) => {
    const month = Number(monthValue);
    const year = selectedYear ?? new Date().getFullYear();
    onChange({
      ...filters,
      ...filtersFromMonthYear(year, month),
    });
  };

  const handleMonthYearChange = (yearValue: string) => {
    const year = Number(yearValue);
    const month = selectedMonth ?? new Date().getMonth() + 1;
    onChange({
      ...filters,
      ...filtersFromMonthYear(year, month),
    });
  };

  const handleYearChange = (yearValue: string) => {
    const year = Number(yearValue);
    onChange({
      ...filters,
      ...filtersFromYear(year),
    });
  };

  return (
    <div className="bg-muted/30 grid gap-4 rounded-md border p-4 md:grid-cols-2 xl:grid-cols-4">
      {periodMode === 'month' ? (
        <div className="space-y-1.5 md:col-span-2">
          <Label>Month</Label>
          <div className="grid gap-2 sm:grid-cols-2">
            <Select
              value={selectedMonth != null ? String(selectedMonth) : undefined}
              onValueChange={handleMonthChange}
            >
              <SelectTrigger id="period_month" aria-label="Month">
                <SelectValue placeholder="Select month" />
              </SelectTrigger>
              <SelectContent>
                {REPORT_MONTH_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={String(option.value)}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={selectedYear != null ? String(selectedYear) : undefined}
              onValueChange={handleMonthYearChange}
            >
              <SelectTrigger id="period_month_year" aria-label="Year">
                <SelectValue placeholder="Select year" />
              </SelectTrigger>
              <SelectContent>
                {yearOptions.map((year) => (
                  <SelectItem key={year} value={String(year)}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      ) : periodMode === 'year' ? (
        <div className="space-y-1.5">
          <Label htmlFor="period_year">Year</Label>
          <Select
            value={selectedYear != null ? String(selectedYear) : undefined}
            onValueChange={handleYearChange}
          >
            <SelectTrigger id="period_year">
              <SelectValue placeholder="Select year" />
            </SelectTrigger>
            <SelectContent>
              {yearOptions.map((year) => (
                <SelectItem key={year} value={String(year)}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : (
        <>
          <div className="space-y-1.5">
            <Label htmlFor="date_from">Date from</Label>
            <ReportDatePicker
              id="date_from"
              value={filters.date_from}
              placeholder="Start date"
              disabledDate={(date) => {
                const maxDate = parseReportDate(filters.date_to);
                return maxDate
                  ? startOfReportDay(date) > startOfReportDay(maxDate)
                  : false;
              }}
              onChange={(value) =>
                onChange({ ...filters, date_from: value || undefined })
              }
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="date_to">Date to</Label>
            <ReportDatePicker
              id="date_to"
              value={filters.date_to}
              placeholder="End date"
              disabledDate={(date) => {
                const minDate = parseReportDate(filters.date_from);
                return minDate
                  ? startOfReportDay(date) < startOfReportDay(minDate)
                  : false;
              }}
              onChange={(value) =>
                onChange({ ...filters, date_to: value || undefined })
              }
            />
          </div>
        </>
      )}
      <div className="space-y-1.5">
        <Label htmlFor="school_year">School year</Label>
        <Input
          id="school_year"
          placeholder="2026-2027"
          value={filters.school_year ?? ''}
          onChange={(event) =>
            onChange({
              ...filters,
              school_year: event.target.value || undefined,
            })
          }
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="semester">Semester</Label>
        <Select
          value={filters.semester ?? 'all'}
          onValueChange={(value) =>
            onChange({
              ...filters,
              semester: value === 'all' ? undefined : value,
            })
          }
        >
          <SelectTrigger id="semester">
            <SelectValue placeholder="All semesters" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All semesters</SelectItem>
            <SelectItem value="first">First</SelectItem>
            <SelectItem value="second">Second</SelectItem>
            <SelectItem value="summer">Summer</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="course_id">Course</Label>
        <Combobox
          items={courses}
          value={selectedCourse}
          itemToStringLabel={(course: ReportCourseOption) => course.label}
          onValueChange={(course: ReportCourseOption | null) =>
            onChange({
              ...filters,
              course_id: course?.id || undefined,
            })
          }
        >
          <ComboboxInput
            id="course_id"
            placeholder="All courses"
            showClear
            disabled={coursesQuery.isLoading}
          />
          <ComboboxContent>
            <ComboboxEmpty>
              {coursesQuery.isError
                ? 'Courses could not be loaded.'
                : 'No courses found.'}
            </ComboboxEmpty>
            <ComboboxList>
              {courses.map((course) => (
                <ComboboxItem key={course.id} value={course}>
                  {course.label}
                </ComboboxItem>
              ))}
            </ComboboxList>
          </ComboboxContent>
        </Combobox>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="receive_mode">Release mode</Label>
        <Select
          value={filters.receive_mode ?? 'all'}
          onValueChange={(value) =>
            onChange({
              ...filters,
              receive_mode:
                value === 'all'
                  ? undefined
                  : (value as ReportFilters['receive_mode']),
            })
          }
        >
          <SelectTrigger id="receive_mode">
            <SelectValue placeholder="All modes" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All modes</SelectItem>
            <SelectItem value="pickup">Pickup</SelectItem>
            <SelectItem value="delivery">Delivery</SelectItem>
            <SelectItem value="email">Email</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2">
        <div>
          <Label htmlFor="paid_only">Paid only</Label>
          <p className="text-muted-foreground text-xs">Limit revenue metrics</p>
        </div>
        <Switch
          id="paid_only"
          checked={Boolean(filters.paid_only)}
          onCheckedChange={(checked) =>
            onChange({ ...filters, paid_only: checked })
          }
        />
      </div>
      <div className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2">
        <div>
          <Label htmlFor="include_cancelled">Include cancelled</Label>
          <p className="text-muted-foreground text-xs">
            Count cancelled applications
          </p>
        </div>
        <Switch
          id="include_cancelled"
          checked={Boolean(filters.include_cancelled)}
          onCheckedChange={(checked) =>
            onChange({ ...filters, include_cancelled: checked })
          }
        />
      </div>
      <div className="flex flex-wrap gap-2 border-t pt-4 md:col-span-2 xl:col-span-4">
        <Button type="button" onClick={onApply} disabled={isApplying}>
          {isApplying ? 'Applying…' : 'Apply filters'}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onReset}
          disabled={isApplying || !canReset}
        >
          Reset
        </Button>
      </div>
    </div>
  );
}
