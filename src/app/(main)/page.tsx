'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAssetFlow } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowDown, ArrowUp, ChevronRight } from 'lucide-react';
import TransactionDialog from '@/components/app/TransactionDialog';
import { Skeleton } from '@/components/ui/skeleton';
import { TransactionType } from '@/lib/types';

export default function DashboardPage() {
  const store = useAssetFlow();
  const [totalBalance, setTotalBalance] = useState<number | null>(null);
  const [currency, setCurrency] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<TransactionType>('income');
  const router = useRouter();

  useEffect(() => {
    if (store.isInitialized) {
      setTotalBalance(store.totalBalance);
      setCurrency(store.currency);
    }
  }, [store.isInitialized, store.totalBalance, store.currency]);

  const getBalanceCardStyle = () => {
    if (totalBalance === null) return {};
    const maxAmount = 5000;
    const intensity = Math.min(Math.abs(totalBalance) / maxAmount, 1);

    if (totalBalance > 0) {
      const lightness = 80 - intensity * 30;
      return { backgroundColor: `hsl(120, 60%, ${lightness}%)` };
    }
    if (totalBalance < 0) {
      const lightness = 80 - intensity * 25;
      return { backgroundColor: `hsl(0, 70%, ${lightness}%)` };
    }
    return { backgroundColor: 'hsl(210, 80%, 70%)' };
  };

  const openDialog = (type: TransactionType) => {
    setDialogType(type);
    setDialogOpen(true);
  };

  return (
    <div className="container mx-auto p-4 sm:p-6">
      <div className="space-y-6">
        <Card
          className="text-primary-foreground shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-1 cursor-pointer"
          style={getBalanceCardStyle()}
          onClick={() => router.push('/assets')}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
          </CardHeader>
          <CardContent>
            {totalBalance !== null && currency !== null ? (
              <div className="text-4xl font-bold tracking-tighter">
                {new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: currency,
                }).format(totalBalance)}
              </div>
            ) : (
              <Skeleton className="h-10 w-3/4 bg-primary-foreground/20" />
            )}
            <div className="text-xs text-primary-foreground/80 flex items-center gap-1 mt-2">
              {totalBalance !== null ? (
                <>
                  View Assets <ChevronRight className="h-3 w-3" />
                </>
              ) : (
                <Skeleton className="h-4 w-20 bg-primary-foreground/20" />
              )}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-4">
          <Button
            variant="outline"
            className="h-28 flex-col gap-2 text-lg border-dashed border-2 hover:border-solid hover:bg-green-500/10"
            onClick={() => openDialog('income')}
          >
            <div className="bg-green-100 text-green-700 rounded-full p-2.5">
              <ArrowDown className="h-6 w-6" />
            </div>
            <span className="font-semibold text-green-800">Income</span>
          </Button>
          <Button
            variant="outline"
            className="h-28 flex-col gap-2 text-lg border-dashed border-2 hover:border-solid hover:bg-red-500/10"
            onClick={() => openDialog('expenditure')}
          >
            <div className="bg-red-100 text-red-700 rounded-full p-2.5">
              <ArrowUp className="h-6 w-6" />
            </div>
            <span className="font-semibold text-red-800">Expense</span>
          </Button>
        </div>

        <div>
          <Button
            asChild
            variant="secondary"
            className="text-base w-full h-12 font-semibold"
          >
            <span
              onClick={() => router.push('/statement')}
              className="cursor-pointer"
            >
              View Statement
            </span>
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
