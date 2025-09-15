'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAssetFlow } from '@/components/app/AppProvider';
import { Transaction } from '@/lib/types';
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
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PlusCircle } from 'lucide-react';
import NestedAccountDialog from './NestedAccountDialog';
import { Separator } from '../ui/separator';

const formSchema = z.object({
  amount: z.coerce.number().positive('Amount must be positive.'),
  accountId: z.string().min(1, 'Please select an account.'),
  remarks: z.string().max(100, 'Remarks are too long.').optional(),
  date: z.string(),
});

interface EditTransactionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction: Transaction;
}

export default function EditTransactionDialog({
  open,
  onOpenChange,
  transaction,
}: EditTransactionDialogProps) {
  const { accounts, editTransaction } = useAssetFlow();
  const [accountDialogOpen, setAccountDialogOpen] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: transaction.amount,
      accountId: transaction.accountId,
      remarks: transaction.remarks,
      date: transaction.date,
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    editTransaction(transaction.id, {
        ...values,
        remarks: values.remarks || ""
    });
    onOpenChange(false);
  };

  const handleAccountCreated = (newAccountId: string) => {
    form.setValue('accountId', newAccountId);
    setAccountDialogOpen(false);
  }

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      form.reset();
    }
    onOpenChange(open);
  }

  const placeholderText = transaction.type === 'expenditure' ? "What are you spending from?" : "Where is the income going to?";

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              Edit {transaction.type === 'income' ? 'Income' : 'Expense'}
            </DialogTitle>
            <DialogDescription>
              Update the details of your transaction.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="accountId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Account</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={placeholderText} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {accounts && accounts.map((account) => (
                          <SelectItem key={account.id} value={account.id}>
                            {account.name}
                          </SelectItem>
                        ))}
                        {accounts && accounts.length > 0 && <Separator className="my-1" />}
                        <div className="p-1">
                          <Button
                            variant="ghost"
                            className="w-full justify-start font-normal"
                            type="button"
                            onSelect={(e) => e.preventDefault()}
                            onClick={() => setAccountDialogOpen(true)}
                          >
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Create New Account
                          </Button>
                        </div>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="remarks"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Remarks</FormLabel>
                    <FormControl>
                      <Textarea placeholder="e.g., Purchased coffee" {...field} />
                    </FormControl>
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
      <NestedAccountDialog
        open={accountDialogOpen}
        onOpenChange={setAccountDialogOpen}
        onAccountCreated={handleAccountCreated}
      />
    </>
  );
}
