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
import { toast } from '@repo/ui/exports';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CreditCard, Plus, ReceiptText, Trash2 } from 'lucide-react';
import { FormEvent, JSX, useState } from 'react';
import { ConfirmActionDialog } from './-clearance/-confirm-action-dialog.tsx';
import {
  createPaymentCollectionBankAccount,
  createPaymentCollectionOtherFee,
  deletePaymentCollectionBankAccount,
  deletePaymentCollectionOtherFee,
  fetchPaymentCollectionSettings,
  type PaymentCollectionBankAccount,
  type PaymentCollectionOtherFee,
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
  const [isBankAccountOpen, setIsBankAccountOpen] = useState(false);
  const [isOtherFeeOpen, setIsOtherFeeOpen] = useState(false);
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [feeName, setFeeName] = useState('');
  const [amount, setAmount] = useState('');
  const [pendingBankAccount, setPendingBankAccount] =
    useState<PaymentCollectionBankAccount | null>(null);
  const [pendingOtherFee, setPendingOtherFee] =
    useState<PaymentCollectionOtherFee | null>(null);

  const settingsQuery = useQuery({
    queryKey: SETTINGS_QUERY_KEY,
    queryFn: fetchPaymentCollectionSettings,
    refetchOnWindowFocus: false,
  });

  const invalidateSettings = () =>
    queryClient.invalidateQueries({ queryKey: SETTINGS_QUERY_KEY });

  const createBankAccountMutation = useMutation({
    mutationFn: createPaymentCollectionBankAccount,
    onSuccess: () => {
      toast.success('Bank account added.');
      setBankName('');
      setAccountNumber('');
      setIsBankAccountOpen(false);
      invalidateSettings();
    },
    onError: () => toast.error('Failed to add bank account.'),
  });

  const deleteBankAccountMutation = useMutation({
    mutationFn: deletePaymentCollectionBankAccount,
    onSuccess: () => {
      toast.success('Bank account removed.');
      setPendingBankAccount(null);
      invalidateSettings();
    },
    onError: () => toast.error('Failed to remove bank account.'),
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
  const bankAccounts = settings?.bank_accounts ?? [];
  const otherFees = settings?.other_fees ?? [];

  const handleBankAccountSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedBankName = bankName.trim();
    const trimmedAccountNumber = accountNumber.trim();

    if (!trimmedBankName || !trimmedAccountNumber) {
      toast.error('Bank name and account number are required.');
      return;
    }

    createBankAccountMutation.mutate({
      bank_name: trimmedBankName,
      account_number: trimmedAccountNumber,
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
          Manage the bank accounts and extra fees shown during student payment.
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
                  Bank accounts
                </CardTitle>
                <CardDescription>
                  Students can choose one of these accounts when submitting
                  payment proof.
                </CardDescription>
              </div>
              <Dialog
                open={isBankAccountOpen}
                onOpenChange={(open) => {
                  setIsBankAccountOpen(open);
                  if (!open) {
                    setBankName('');
                    setAccountNumber('');
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
                    Add account
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Add bank account</DialogTitle>
                    <DialogDescription>
                      Add an account students may use when paying assessed
                      document fees.
                    </DialogDescription>
                  </DialogHeader>
                  <form
                    className="space-y-4"
                    onSubmit={handleBankAccountSubmit}
                  >
                    <div>
                      <Label htmlFor="payment-bank-name">Bank name</Label>
                      <Input
                        id="payment-bank-name"
                        className="mt-1"
                        value={bankName}
                        onChange={(event) => setBankName(event.target.value)}
                        placeholder="e.g. BDO"
                        autoComplete="off"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="payment-account-number">
                        Account number
                      </Label>
                      <Input
                        id="payment-account-number"
                        className="mt-1"
                        value={accountNumber}
                        onChange={(event) =>
                          setAccountNumber(event.target.value)
                        }
                        placeholder="Account number"
                        autoComplete="off"
                        required
                      />
                    </div>
                    <DialogFooter>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsBankAccountOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={createBankAccountMutation.isPending}
                      >
                        Add account
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {bankAccounts.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  No bank accounts yet.
                </p>
              ) : (
                <div className="space-y-2">
                  {bankAccounts.map((account) => (
                    <div
                      key={account.id}
                      className="bg-accent border-border flex items-center justify-between gap-3 rounded-lg border p-3"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {account.bank_name}
                        </p>
                        <p className="text-muted-foreground truncate text-xs">
                          {account.account_number}
                        </p>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="shrink-0"
                        onClick={() => setPendingBankAccount(account)}
                        disabled={deleteBankAccountMutation.isPending}
                        aria-label="Remove bank account"
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
            open={pendingBankAccount !== null}
            onOpenChange={(open) => {
              if (!open) setPendingBankAccount(null);
            }}
            title="Remove bank account?"
            description={
              pendingBankAccount ? (
                <>
                  Remove{' '}
                  <span className="font-medium">
                    {pendingBankAccount.bank_name}
                  </span>{' '}
                  from payment collection?
                </>
              ) : null
            }
            confirmLabel="Remove account"
            pending={deleteBankAccountMutation.isPending}
            onConfirm={() => {
              if (pendingBankAccount) {
                deleteBankAccountMutation.mutate(pendingBankAccount.id);
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
