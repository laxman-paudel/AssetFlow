'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAssetFlow } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowDownCircle, ArrowUpCircle, ChevronRight } from 'lucide-react';
import TransactionDialog from '@/components/app/TransactionDialog';
import { Skeleton } from '@/components/ui/skeleton';
import { TransactionType } from '@/lib/types';

export default function DashboardPage() {
  const { totalBalance, isInitialized } = useAssetFlow();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<TransactionType>('income');

  const openDialog = (type: TransactionType) => {
    setDialogType(type);
    setDialogOpen(true);
  };

  const formattedBalance = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD', // This can be made dynamic in a real app
  }).format(totalBalance);

  return (
    <div className="container mx-auto p-4 sm:p-6">
      <div className="space-y-6">
        <Link href="/assets">
          <Card className="cursor-pointer transition-shadow hover:shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Balance
              </CardTitle>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isInitialized ? (
                <div className="text-4xl font-bold tracking-tighter">
                  {formattedBalance}
                </div>
              ) : (
                <Skeleton className="h-10 w-3/4" />
              )}
              <p className="text-xs text-muted-foreground pt-2">
                Click to view asset details
              </p>
            </CardContent>
          </Card>
        </Link>

        <div className="grid grid-cols-2 gap-4">
          <Button
            variant="outline"
            className="h-24 flex-col gap-2 text-lg"
            onClick={() => openDialog('income')}
          >
            <ArrowDownCircle className="h-8 w-8 text-green-500" />
            <span>INCOME</span>
          </Button>
          <Button
            variant="outline"
            className="h-24 flex-col gap-2 text-lg"
            onClick={() => openDialog('expenditure')}
          >
            <ArrowUpCircle className="h-8 w-8 text-red-500" />
            <span>EXPENSE</span>
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-4">
            <Button asChild variant="secondary">
                <Link href="/statement">View Statement</Link>
            </Button>
            <Button asChild variant="secondary">
                <Link href="/assets">Manage Assets</Link>
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
