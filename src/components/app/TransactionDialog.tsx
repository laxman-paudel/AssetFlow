'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAssetFlow } from '@/lib/store';
import { TransactionType } from '@/lib/types';
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
import NestedAssetDialog from './NestedAssetDialog';
import { Separator } from '../ui/separator';

const formSchema = z.object({
  amount: z.coerce.number().positive('Amount must be positive.'),
  assetId: z.string().min(1, 'Please select an asset.'),
  remarks: z.string().max(100, 'Remarks are too long.'),
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
  const { assets, addTransaction } = useAssetFlow();
  const [assetDialogOpen, setAssetDialogOpen] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: 0,
      assetId: '',
      remarks: '',
    },
  });
  
  const lastAssetId = assets.length > 0 ? assets[assets.length - 1].id : '';
  useEffect(() => {
    if (assets.length === 1 && form.getValues('assetId') === '') {
        form.setValue('assetId', assets[0].id);
    }
  }, [assets, form]);


  const onSubmit = (values: z.infer<typeof formSchema>) => {
    addTransaction(type, values.amount, values.assetId, values.remarks);
    onOpenChange(false);
    form.reset();
  };
  
  const handleAssetCreated = (newAssetId: string) => {
    form.setValue('assetId', newAssetId);
    setAssetDialogOpen(false);
  }
  
  const placeholderText = type === 'expenditure' ? "What are you spending from?" : "Where is the income going to?";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
              name="assetId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Asset</FormLabel>
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
                      {assets.map((asset) => (
                          <SelectItem key={asset.id} value={asset.id}>
                            {asset.name}
                          </SelectItem>
                        ))}
                      {(assets.length > 0) && <Separator className="my-1" />}
                      <Button
                            variant="ghost"
                            className="w-full justify-start font-normal"
                            type="button"
                            onClick={() => setAssetDialogOpen(true)}
                        >
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Create New Asset
                        </Button>
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
              <Button type="submit">Save Transaction</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
       <NestedAssetDialog 
        open={assetDialogOpen} 
        onOpenChange={setAssetDialogOpen}
        onAssetCreated={handleAssetCreated}
      />
    </Dialog>
  );
}
