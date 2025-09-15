'use client';

import { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAssetFlow } from '@/components/app/AppProvider';
import { TransactionType, Category } from '@/lib/types';
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
import { PlusCircle, Shapes } from 'lucide-react';
import NestedAccountDialog from './NestedAccountDialog';
import { Separator } from '../ui/separator';
import { getIncomeCategories, getExpenseCategories } from '@/lib/categories';
import CategoryDialog from './CategoryDialog';

const formSchema = z.object({
  amount: z.coerce.number().positive('Amount must be positive.'),
  accountId: z.string().min(1, 'Please select an account.'),
  remarks: z.string().max(100, 'Remarks are too long.').optional(),
  category: z.string().optional(),
});

interface TransactionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: TransactionType;
}

export default function TransactionDialog({
  open,
  onOpenChange,
  type,
}: TransactionDialogProps) {
  const { accounts, customCategories, categoriesEnabled, addTransaction } = useAssetFlow();
  const [accountDialogOpen, setAccountDialogOpen] = useState(false);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: '' as any,
      accountId: '',
      remarks: '',
      category: '',
    },
  });
  
  useEffect(() => {
    if (accounts && accounts.length === 1 && !form.getValues('accountId')) {
        form.setValue('accountId', accounts[0].id);
    }
  }, [accounts, form]);


  const onSubmit = (values: z.infer<typeof formSchema>) => {
    addTransaction(type, values.amount, values.accountId, values.remarks || '', values.category);
    onOpenChange(false);
    form.reset({ amount: '' as any, accountId: '', remarks: '', category: '' });
  };
  
  const handleAccountCreated = (newAccountId: string) => {
    form.setValue('accountId', newAccountId);
    setAccountDialogOpen(false);
  }

  const handleCategoryCreated = (newCategory: Category) => {
    form.setValue('category', newCategory.id);
    setCategoryDialogOpen(false);
  };
  
  const handleOpenChange = (open: boolean) => {
    if (!open) {
        form.reset({ amount: '' as any, accountId: '', remarks: '', category: '' });
    }
    onOpenChange(open);
  }
  
  const placeholderText = type === 'expenditure' ? "What are you spending from?" : "Where is the income going to?";
  
  const categories = useMemo(() => {
    const allCustomCategories = customCategories || [];
    return type === 'income' 
      ? getIncomeCategories(allCustomCategories) 
      : getExpenseCategories(allCustomCategories);
  }, [type, customCategories]);

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              Record {type === 'income' ? 'Income' : 'Expense'}
            </DialogTitle>
            <DialogDescription>
              Enter the details of your transaction below.
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
                      <Input type="number" step="0.01" placeholder="0.00" {...field} />
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
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                    >
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
               {categoriesEnabled && <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map((cat) => {
                           const Icon = cat.icon || Shapes;
                           return (
                            <SelectItem key={cat.id} value={cat.id}>
                                <div className="flex items-center gap-2">
                                    <Icon className="h-4 w-4 text-muted-foreground" />
                                    {cat.name}
                                </div>
                            </SelectItem>
                           )
                        })}
                        <Separator className="my-1" />
                        <div className="p-1">
                          <Button
                                variant="ghost"
                                className="w-full justify-start font-normal"
                                type="button"
                                onSelect={(e) => e.preventDefault()}
                                onClick={() => setCategoryDialogOpen(true)}
                            >
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Create New Category
                            </Button>
                        </div>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />}
              <FormField
                control={form.control}
                name="remarks"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Remarks</FormLabel>
                    <FormControl>
                      <Textarea placeholder="e.g., Salary, Groceries" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="submit">Save Transaction</Button>
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
      <CategoryDialog
        open={categoryDialogOpen}
        onOpenChange={setCategoryDialogOpen}
        onCategoryCreated={handleCategoryCreated}
        type={type}
      />
    </>
  );
}
