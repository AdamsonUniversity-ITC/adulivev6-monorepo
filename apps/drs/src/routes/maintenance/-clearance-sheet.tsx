import { Card, CardContent } from '@repo/ui/components/card';
import { useQuery } from '@tanstack/react-query';
import { JSX, useEffect, useState } from 'react';
import { AddDepartmentDialog } from './-clearance/-add-department-dialog.tsx';
import { DepartmentDetail } from './-clearance/-department-detail.tsx';
import { DepartmentsList } from './-clearance/-departments-list.tsx';
import { getDepartments } from './-clearance/-utils.ts';
import { fetchClearanceDepartments } from './-lib/api/fetchClearanceDepartments.ts';

export const ClearanceSheet = (): JSX.Element => {
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<
    number | string | null
  >(null);

  const { data, isError, isLoading } = useQuery({
    queryKey: ['clearance_departments'],
    queryFn: fetchClearanceDepartments,
    refetchOnWindowFocus: false,
  });

  const departments = getDepartments(data);

  const selectedDepartment =
    departments.find(
      (department) => String(department.id) === String(selectedDepartmentId),
    ) ?? null;

  useEffect(() => {
    const firstDepartment = departments[0];

    if (!firstDepartment) {
      if (selectedDepartmentId !== null) {
        setSelectedDepartmentId(null);
      }
      return;
    }

    if (selectedDepartmentId === null) {
      setSelectedDepartmentId(firstDepartment.id);
      return;
    }

    const stillExists = departments.some(
      (department) => String(department.id) === String(selectedDepartmentId),
    );

    if (!stillExists) {
      setSelectedDepartmentId(firstDepartment.id);
    }
  }, [departments, selectedDepartmentId]);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-foreground text-lg font-semibold">
            Clearance departments
          </h2>
          <p className="text-muted-foreground text-sm">
            Group sign-off responsibilities by department, then assign the users
            who can clear each one.
          </p>
        </div>
        <AddDepartmentDialog />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <DepartmentsList
            departments={departments}
            isLoading={isLoading}
            isError={isError}
            selectedDepartmentId={selectedDepartmentId}
            onSelect={setSelectedDepartmentId}
          />
        </div>

        <div className="lg:col-span-2">
          {selectedDepartment ? (
            <DepartmentDetail department={selectedDepartment} />
          ) : (
            <Card className="border-border border">
              <CardContent className="flex h-full items-center justify-center py-16">
                <p className="text-muted-foreground text-sm">
                  Select a department to view and manage its users.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};
