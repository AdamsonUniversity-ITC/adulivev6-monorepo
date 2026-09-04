import { Button } from '@repo/ui/components/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@repo/ui/components/card';
import { JSX } from 'react';
import { useMaintenanceNavigation } from './-maintenance-navigation-context.tsx';
import { TaskKindAccessPanel } from './-workflow/-task-kind-access-panel.tsx';

const PAYMENT_VERIFICATION_KIND = 'payment_verification';

export const PaymentVerificationSheet = (): JSX.Element => {
  const { openUserManagement } = useMaintenanceNavigation();

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-foreground text-lg font-semibold">
          Payment verification
        </h2>
        <p className="text-muted-foreground text-sm">
          Assign employees who may verify student payments for this registrar
          tenant.
        </p>
      </div>

      <Card className="border-border border">
        <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
          <div>
            <CardTitle className="text-base">Operator access</CardTitle>
            <CardDescription>
              Cashiers listed here can complete payment verification tasks in
              the staff queue.
            </CardDescription>
          </div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={openUserManagement}
          >
            Manage in User Management
          </Button>
        </CardHeader>
        <CardContent>
          <TaskKindAccessPanel
            kind={PAYMENT_VERIFICATION_KIND}
            title="Payment verification"
            defaultExpanded
            allowRoles={false}
            readOnly
            readOnlyDescription="Employee assignment is centralized in User Management."
          />
        </CardContent>
      </Card>
    </div>
  );
};
