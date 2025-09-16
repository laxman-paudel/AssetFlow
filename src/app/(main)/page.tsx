'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAssetFlow } from '@/components/app/AppProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowDown, ArrowUp, ChevronRight, Wallet, ArrowRightLeft } from 'lucide-react';
import TransactionDialog from '@/components/app/TransactionDialog';
import { Skeleton } from '@/components/ui/skeleton';
import AccountDialog from '@/components/app/AccountDialog';
import { Separator } from '@/components/ui/separator';
import { useCountUp } from '@/hooks/useCountUp';
import TransferDialog from '@/components/app/TransferDialog';

type DialogType = 'income' | 'expenditure' | 'account' | 'transfer';

export default function DashboardPage() {
  const { totalBalance, currency, isInitialized } = useAssetFlow();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<DialogType>('income');
  const router = useRouter();
  
  const animatedBalance = useCountUp(totalBalance ?? 0);

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

  const openDialog = (type: DialogType) => {
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
            {isInitialized && totalBalance !== null && currency ? (
              <>
                <div className="text-4xl font-bold tracking-tighter">
                  {new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: currency,
                  }).format(animatedBalance)}
                </div>
                <div className="text-xs text-primary-foreground/80 flex items-center gap-1 mt-2">
                  View Accounts <ChevronRight className="h-3 w-3" />
                </div>
              </>
            ) : (
              <>
                <Skeleton className="h-10 w-3/4 bg-primary-foreground/20" />
                <Skeleton className="h-4 w-20 bg-primary-foreground/20 mt-2" />
              </>
            )}
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
        
        <Separator />
        
        <div className="flex flex-wrap justify-center gap-4">
            <Button
                variant="outline"
                className="h-20 flex-1 min-w-[150px] flex-col gap-2 text-lg"
                onClick={() => openDialog('transfer')}
            >
                <div className="flex items-center gap-3">
                    <div className="bg-purple-100 text-purple-700 rounded-full p-2">
                        <ArrowRightLeft className="h-5 w-5" />
                    </div>
                    <span className="font-semibold text-purple-800">Transfer</span>
                </div>
            </Button>
            <Button
                variant="outline"
                className="h-20 flex-1 min-w-[150px] flex-col gap-2 text-lg"
                onClick={() => openDialog('account')}
            >
                <div className="flex items-center gap-3">
                    <div className="bg-blue-100 text-blue-700 rounded-full p-2">
                        <Wallet className="h-5 w-5" />
                    </div>
                    <span className="font-semibold text-blue-800">New Account</span>
                </div>
            </Button>
        </div>
      </div>

      {dialogType === 'account' && (
          <AccountDialog open={dialogOpen} onOpenChange={setDialogOpen} />
      )}
      {dialogType === 'transfer' && (
            <TransferDialog open={dialogOpen} onOpenChange={setDialogOpen} />
      )}
      {(dialogType === 'income' || dialogType === 'expenditure') && (
          <TransactionDialog
            open={dialogOpen}
            onOpenChange={setDialogOpen}
            type={dialogType}
          />
      )}
    </div>
  );
}
