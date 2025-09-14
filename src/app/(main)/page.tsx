'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAssetFlow } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowDown, ArrowUp, ChevronRight } from 'lucide-react';
import TransactionDialog from '@/components/app/TransactionDialog';
import { Skeleton } from '@/components/ui/skeleton';
import { TransactionType } from '@/lib/types';

export default function DashboardPage() {
  const { totalBalance, isInitialized, currency } = useAssetFlow();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<TransactionType>('income');

  const openDialog = (type: TransactionType) => {
    setDialogType(type);
    setDialogOpen(true);
  };

  const formattedBalance = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(totalBalance);

  return (
    <div className="container mx-auto p-4 sm:p-6">
      <div className="space-y-6">
        <Card className="bg-primary text-primary-foreground">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Total Balance
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isInitialized ? (
                <div className="text-4xl font-bold tracking-tighter">
                  {formattedBalance}
                </div>
              ) : (
                <Skeleton className="h-10 w-3/4 bg-primary-foreground/20" />
              )}
               <Link href="/assets" className='block mt-2'>
                <p className="text-xs text-primary-foreground/80 flex items-center gap-1">
                    View Assets <ChevronRight className="h-3 w-3" />
                </p>
               </Link>
            </CardContent>
          </Card>

        <div className="grid grid-cols-2 gap-4">
          <Button
            variant="outline"
            className="h-24 flex-col gap-2 text-lg"
            onClick={() => openDialog('income')}
          >
            <div className='bg-green-100 text-green-700 rounded-full p-2'>
              <ArrowDown className="h-6 w-6" />
            </div>
            <span>Income</span>
          </Button>
          <Button
            variant="outline"
            className="h-24 flex-col gap-2 text-lg"
            onClick={() => openDialog('expenditure')}
          >
             <div className='bg-red-100 text-red-700 rounded-full p-2'>
              <ArrowUp className="h-6 w-6" />
            </div>
            <span>Expense</span>
          </Button>
        </div>

        <div>
            <Button asChild variant="secondary" className='text-base w-full'>
                <Link href="/statement">View Statement</Link>
            </Button>
        </div>
      </div>
      <TransactionDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        type={dialogType}
      />
    </div>
  );
}
