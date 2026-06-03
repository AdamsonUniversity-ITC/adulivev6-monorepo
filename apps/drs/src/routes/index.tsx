import {
  DRS_STUDENT_APPLY_PERMISSION,
  getDrMaintenancePermissionForHost,
} from '@/lib/drsPermissions.ts';
import { fetchAuthUser, normalizePermissions } from '@/lib/fetchAuthUser.ts';
import { checkPermission, usePermission } from '@repo/hooks';
import { Button } from '@repo/ui/components/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@repo/ui/components/card';
import { Spinner } from '@repo/ui/components/spinner';
import { Link, createFileRoute } from '@tanstack/react-router';
import { ApplicationsDataTable } from './-applications-datatable.tsx';
import { loadMaintenanceAccess } from './maintenance/-lib/loadMaintenanceAccess.ts';
import { MaintenanceHome } from './maintenance/-maintenance-home.tsx';
import type { MaintenanceLoaderAccess } from './maintenance/-maintenance-loader-data-context.tsx';

export const Route = createFileRoute('/')({
  loader: async () => {
    const { data } = await fetchAuthUser();
    const permissions = normalizePermissions(data);
    const hasCollege = checkPermission(
      permissions,
      DRS_STUDENT_APPLY_PERMISSION,
    );
    const maintPerm = getDrMaintenancePermissionForHost();
    const hasMaint =
      maintPerm !== null && checkPermission(permissions, maintPerm);

    let access: MaintenanceLoaderAccess = [];
    if (!hasCollege && hasMaint) {
      const m = await loadMaintenanceAccess();
      access = m.access;
    }

    return { permissions, access };
  },
  pendingComponent: () => (
    <div className="flex min-h-[40vh] items-center justify-center p-8">
      <Spinner />
    </div>
  ),
  component: Index,
});

function Index() {
  const { permissions, access } = Route.useLoaderData();
  const { checkPermission: cp } = usePermission(permissions);
  const hasCollege = cp(DRS_STUDENT_APPLY_PERMISSION);
  const maintPerm = getDrMaintenancePermissionForHost();
  const hasMaint = maintPerm !== null && cp(maintPerm);

  if (hasCollege) {
    return (
      <div id="root" className="bg-background min-h-screen p-4">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>DRS</CardTitle>
              <CardDescription>
                Your applications — click a row to open details, messages, and
                edits (when allowed).
              </CardDescription>
            </CardHeader>
            <CardContent className="">
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button asChild>
                  <Link to="/apply">Apply for documents</Link>
                </Button>

                {hasMaint ? (
                  <Button variant="outline" asChild>
                    <Link to="/maintenance">Maintenance</Link>
                  </Button>
                ) : null}
              </div>
              <section className="flex flex-col gap-2">
                <ApplicationsDataTable />
              </section>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (hasMaint) {
    return (
      <div id="root" className="bg-background min-h-screen">
        <MaintenanceHome access={access} />
      </div>
    );
  }

  return (
    <div id="root" className="bg-background min-h-screen p-4">
      <div className="mx-auto flex w-full max-w-lg flex-col gap-6">
        <Card>
          <CardHeader>
            <CardTitle>DRS</CardTitle>
            <CardDescription>No access</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground text-sm">
              You do not have permission to use this DRS tenant. If you believe
              this is an error, contact your administrator.
            </p>
            <p className="text-muted-foreground text-sm">
              If you complete workflow tasks for students (for example clearance
              sign-off), try the{' '}
              <Link className="text-primary underline" to="/staff/queue">
                staff queue
              </Link>
              .
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
