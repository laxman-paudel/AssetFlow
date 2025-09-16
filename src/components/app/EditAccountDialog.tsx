'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAssetFlow } from '@/components/app/AppProvider';
import { Account } from '@/lib/types';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription as FormDescriptionNew
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useMemo } from 'react';

const formSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters.'),
  balance: z.coerce.number(),
});

interface EditAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  account: Account;
}

export default function EditAccountDialog({ open, onOpenChange, account }: EditAccountDialogProps) {
  const { editAccount, transactions } = useAssetFlow();

  const hasTransactions = useMemo(() => {
    if (!transactions) return false;
    return transactions.some(t => {
      // Check if it's a regular income/expense/transfer for this account
      if (t.accountId === account.id && t.type !== 'account_creation') return true;
      // Check if it's a transfer *to* this account
      if (t.toAccountId === account.id) return true;
      return false;
    });
  }, [transactions, account.id]);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: account.name,
      balance: account.balance,
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    editAccount(account, values);
    onOpenChange(false);
  };
  
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      form.reset();
    }
    onOpenChange(open);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Account</DialogTitle>
          <DialogDescription>
            Update the details for your account.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Account Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Primary bank balance" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="balance"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Balance</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" {...field} disabled={hasTransactions} />
                  </FormControl>
                  {hasTransactions ? (
                    <FormDescriptionNew>
                      Balance cannot be directly edited as transactions have been recorded. To adjust, create a new income or expense transaction.
                    </FormDescriptionNew>
                  ) : (
                    <FormDescriptionNew>
                      Set the current balance for this account. This action will be recorded.
                    </FormDescriptionNew>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit">Save Changes</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
