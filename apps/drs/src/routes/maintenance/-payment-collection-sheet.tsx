import { Button } from '@repo/ui/components/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@repo/ui/components/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@repo/ui/components/dialog';
import { Input } from '@repo/ui/components/input';
import { Label } from '@repo/ui/components/label';
import { Textarea } from '@repo/ui/components/textarea';
import { toast } from '@repo/ui/exports';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CreditCard, Plus, ReceiptText, Trash2 } from 'lucide-react';
import { FormEvent, JSX, useState } from 'react';
import { ConfirmActionDialog } from './-clearance/-confirm-action-dialog.tsx';
import {
  createPaymentCollectionOtherFee,
  createPaymentCollectionPaymentMethod,
  deletePaymentCollectionOtherFee,
  deletePaymentCollectionPaymentMethod,
  fetchPaymentCollectionSettings,
  type PaymentCollectionOtherFee,
  type PaymentCollectionPaymentMethod,
} from './-lib/api/paymentCollectionSettings.ts';

const SETTINGS_QUERY_KEY = ['payment_collection_settings'] as const;

const formatAmount = (amount: string): string => {
  const value = Number(amount);

  if (!Number.isFinite(value)) {
    return amount;
  }

  return new Intl.NumberFormat(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

export const PaymentCollectionSheet = (): JSX.Element => {
  const queryClient = useQueryClient();
  const [isPaymentMethodOpen, setIsPaymentMethodOpen] = useState(false);
  const [isOtherFeeOpen, setIsOtherFeeOpen] = useState(false);
  const [methodName, setMethodName] = useState('');
  const [methodDescription, setMethodDescription] = useState('');
  const [feeName, setFeeName] = useState('');
  const [amount, setAmount] = useState('');
  const [pendingPaymentMethod, setPendingPaymentMethod] =
    useState<PaymentCollectionPaymentMethod | null>(null);
  const [pendingOtherFee, setPendingOtherFee] =
    useState<PaymentCollectionOtherFee | null>(null);

  const settingsQuery = useQuery({
    queryKey: SETTINGS_QUERY_KEY,
    queryFn: fetchPaymentCollectionSettings,
    refetchOnWindowFocus: false,
  });

  const invalidateSettings = () =>
    queryClient.invalidateQueries({ queryKey: SETTINGS_QUERY_KEY });

  const createPaymentMethodMutation = useMutation({
    mutationFn: createPaymentCollectionPaymentMethod,
    onSuccess: () => {
      toast.success('Payment method added.');
      setMethodName('');
      setMethodDescription('');
      setIsPaymentMethodOpen(false);
      invalidateSettings();
    },
    onError: () => toast.error('Failed to add payment method.'),
  });

  const deletePaymentMethodMutation = useMutation({
    mutationFn: deletePaymentCollectionPaymentMethod,
    onSuccess: () => {
      toast.success('Payment method removed.');
      setPendingPaymentMethod(null);
      invalidateSettings();
    },
    onError: () => toast.error('Failed to remove payment method.'),
  });

  const createOtherFeeMutation = useMutation({
    mutationFn: createPaymentCollectionOtherFee,
    onSuccess: () => {
      toast.success('Other fee added.');
      setFeeName('');
      setAmount('');
      setIsOtherFeeOpen(false);
      invalidateSettings();
    },
    onError: () => toast.error('Failed to add other fee.'),
  });

  const deleteOtherFeeMutation = useMutation({
    mutationFn: deletePaymentCollectionOtherFee,
    onSuccess: () => {
      toast.success('Other fee removed.');
      setPendingOtherFee(null);
      invalidateSettings();
    },
    onError: () => toast.error('Failed to remove other fee.'),
  });

  const settings = settingsQuery.data;
  const paymentMethods = settings?.payment_methods ?? [];
  const otherFees = settings?.other_fees ?? [];

  const handlePaymentMethodSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedName = methodName.trim();
    const trimmedDescription = methodDescription.trim();

    if (!trimmedName) {
      toast.error('Payment method name is required.');
      return;
    }

    createPaymentMethodMutation.mutate({
      name: trimmedName,
      description: trimmedDescription || null,
    });
  };

  const handleOtherFeeSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedFeeName = feeName.trim();
    const trimmedAmount = amount.trim();

    if (!trimmedFeeName || trimmedAmount === '') {
      toast.error('Fee name and amount are required.');
      return;
    }

    createOtherFeeMutation.mutate({
      fee_name: trimmedFeeName,
      amount: trimmedAmount,
    });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-foreground text-lg font-semibold">
          Payment collection
        </h2>
        <p className="text-muted-foreground text-sm">
          Manage payment methods and extra fees shown when students apply and
          pay.
        </p>
      </div>

      {settingsQuery.isLoading ? (
        <p className="text-muted-foreground text-sm">Loading settings…</p>
      ) : settingsQuery.isError || !settings ? (
        <p className="text-destructive text-sm">
          Could not load payment collection settings. Check tenant context and
          try again.
        </p>
      ) : (
        <>
          <Card className="border-border border">
            <CardHeader className="flex flex-row items-start justify-between space-y-0">
              <div>
                <CardTitle className="flex items-center gap-2 text-base">
                  <CreditCard className="h-4 w-4" />
                  Payment methods
                </CardTitle>
                <CardDescription>
                  Students choose one of these methods when submitting a
                  request. Use the description for service fees or payment
                  instructions.
                </CardDescription>
              </div>
              <Dialog
                open={isPaymentMethodOpen}
                onOpenChange={(open) => {
                  setIsPaymentMethodOpen(open);
                  if (!open) {
                    setMethodName('');
                    setMethodDescription('');
                  }
                }}
              >
                <DialogTrigger asChild>
                  <Button
                    className="shrink-0 gap-2"
                    size="sm"
                    variant="outline"
                  >
                    <Plus className="h-4 w-4" />
                    Add method
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Add payment method</DialogTitle>
                    <DialogDescription>
                      Examples: Cashier, GCash, bank transfer. Description is
                      shown when a student selects the method.
                    </DialogDescription>
                  </DialogHeader>
                  <form
                    className="space-y-4"
                    onSubmit={handlePaymentMethodSubmit}
                  >
                    <div>
                      <Label htmlFor="payment-method-name">Name</Label>
                      <Input
                        id="payment-method-name"
                        className="mt-1"
                        value={methodName}
                        onChange={(event) => setMethodName(event.target.value)}
                        placeholder="e.g. GCash"
                        autoComplete="off"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="payment-method-description">
                        Description
                      </Label>
                      <Textarea
                        id="payment-method-description"
                        className="mt-1"
                        value={methodDescription}
                        onChange={(event) =>
                          setMethodDescription(event.target.value)
                        }
                        placeholder="e.g. Service fee may apply. Send payment to…"
                        rows={3}
                      />
                    </div>
                    <DialogFooter>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsPaymentMethodOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={createPaymentMethodMutation.isPending}
                      >
                        Add method
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {paymentMethods.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  No payment methods yet.
                </p>
              ) : (
                <div className="space-y-2">
                  {paymentMethods.map((method) => (
                    <div
                      key={method.id}
                      className="bg-accent border-border flex items-center justify-between gap-3 rounded-lg border p-3"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {method.name}
                        </p>
                        {method.description ? (
                          <p className="text-muted-foreground line-clamp-2 text-xs">
                            {method.description}
                          </p>
                        ) : null}
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="shrink-0"
                        onClick={() => setPendingPaymentMethod(method)}
                        disabled={deletePaymentMethodMutation.isPending}
                        aria-label="Remove payment method"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-border border">
            <CardHeader className="flex flex-row items-start justify-between space-y-0">
              <div>
                <CardTitle className="flex items-center gap-2 text-base">
                  <ReceiptText className="h-4 w-4" />
                  Other fees
                </CardTitle>
                <CardDescription>
                  Maintain extra payment items that belong to this registrar
                  tenant.
                </CardDescription>
              </div>
              <Dialog
                open={isOtherFeeOpen}
                onOpenChange={(open) => {
                  setIsOtherFeeOpen(open);
                  if (!open) {
                    setFeeName('');
                    setAmount('');
                  }
                }}
              >
                <DialogTrigger asChild>
                  <Button
                    className="shrink-0 gap-2"
                    size="sm"
                    variant="outline"
                  >
                    <Plus className="h-4 w-4" />
                    Add fee
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Add other fee</DialogTitle>
                    <DialogDescription>
                      Add a named fee and amount for payment collection.
                    </DialogDescription>
                  </DialogHeader>
                  <form className="space-y-4" onSubmit={handleOtherFeeSubmit}>
                    <div>
                      <Label htmlFor="payment-fee-name">Fee name</Label>
                      <Input
                        id="payment-fee-name"
                        className="mt-1"
                        value={feeName}
                        onChange={(event) => setFeeName(event.target.value)}
                        placeholder="e.g. Convenience fee"
                        autoComplete="off"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="payment-fee-amount">Amount</Label>
                      <Input
                        id="payment-fee-amount"
                        className="mt-1"
                        type="number"
                        min="0"
                        step="0.01"
                        value={amount}
                        onChange={(event) => setAmount(event.target.value)}
                        placeholder="0.00"
                        required
                      />
                    </div>
                    <DialogFooter>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsOtherFeeOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={createOtherFeeMutation.isPending}
                      >
                        Add fee
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {otherFees.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  No other fees yet.
                </p>
              ) : (
                <div className="space-y-2">
                  {otherFees.map((fee) => (
                    <div
                      key={fee.id}
                      className="bg-accent border-border flex items-center justify-between gap-3 rounded-lg border p-3"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {fee.fee_name}
                        </p>
                        <p className="text-muted-foreground truncate text-xs">
                          {formatAmount(fee.amount)}
                        </p>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="shrink-0"
                        onClick={() => setPendingOtherFee(fee)}
                        disabled={deleteOtherFeeMutation.isPending}
                        aria-label="Remove other fee"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <ConfirmActionDialog
            open={pendingPaymentMethod !== null}
            onOpenChange={(open) => {
              if (!open) setPendingPaymentMethod(null);
            }}
            title="Remove payment method?"
            description={
              pendingPaymentMethod ? (
                <>
                  Remove{' '}
                  <span className="font-medium">
                    {pendingPaymentMethod.name}
                  </span>{' '}
                  from payment collection?
                </>
              ) : null
            }
            confirmLabel="Remove method"
            pending={deletePaymentMethodMutation.isPending}
            onConfirm={() => {
              if (pendingPaymentMethod) {
                deletePaymentMethodMutation.mutate(pendingPaymentMethod.id);
              }
            }}
          />

          <ConfirmActionDialog
            open={pendingOtherFee !== null}
            onOpenChange={(open) => {
              if (!open) setPendingOtherFee(null);
            }}
            title="Remove other fee?"
            description={
              pendingOtherFee ? (
                <>
                  Remove{' '}
                  <span className="font-medium">
                    {pendingOtherFee.fee_name}
                  </span>{' '}
                  from payment collection?
                </>
              ) : null
            }
            confirmLabel="Remove fee"
            pending={deleteOtherFeeMutation.isPending}
            onConfirm={() => {
              if (pendingOtherFee) {
                deleteOtherFeeMutation.mutate(pendingOtherFee.id);
              }
            }}
          />
        </>
      )}
    </div>
  );
};
