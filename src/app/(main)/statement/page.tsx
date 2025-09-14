'use client';

import { useMemo, useState, useEffect } from 'react';
import { useAssetFlow } from '@/lib/store';
import { Transaction } from '@/lib/types';
import {
  ArrowDown,
  ArrowDownUp,
  ArrowUp,
  Filter,
  Landmark,
  Wallet,
  CreditCard,
  HelpCircle,
  BookText,
  PlusSquare,
  Trash2,
  Pencil
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { Separator } from '@/components/ui/separator';
import EditTransactionDialog from '@/components/app/EditTransactionDialog';
import ExportButton from '@/components/app/ExportButton';

export default function StatementPage() {
  const { transactions, assets, isInitialized, currency, deleteTransaction, totalBalance } = useAssetFlow();
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedAssets, setSelectedAssets] = useState<string[]>([]);
  const [showAssetCreations, setShowAssetCreations] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
  }, []);

  const filteredTransactions = useMemo(() => {
    let items = [...transactions];

    if (!showAssetCreations) {
      items = items.filter((t) => t.type !== 'asset_creation');
    }

    if (selectedAssets.length > 0) {
      items = items.filter(
        (t) => t.type === 'asset_creation' || selectedAssets.includes(t.assetId)
      );
    }

    items.sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    });

    return items;
  }, [transactions, sortOrder, selectedAssets, showAssetCreations]);

  const handleAssetFilterChange = (assetId: string) => {
    setSelectedAssets((prev) =>
      prev.includes(assetId)
        ? prev.filter((id) => id !== assetId)
        : [...prev, assetId]
    );
  };

  const formatCurrency = (amount: number) => {
    if (!currency) return '...';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };
  
  const getBalanceCardStyle = () => {
    if (!isClient || !isInitialized) return {};

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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  };

  const getAssetIcon = (assetName: string) => {
    if (!assetName) {
      return <HelpCircle className="h-5 w-5 text-muted-foreground" />;
    }
    const lowerCaseName = assetName.toLowerCase();
    if (lowerCaseName.includes('bank')) {
      return <Landmark className="h-5 w-5 text-muted-foreground" />;
    }
    if (lowerCaseName.includes('card') || lowerCaseName.includes('credit')) {
      return <CreditCard className="h-5 w-5 text-muted-foreground" />;
    }
    if (lowerCaseName.includes('cash') || lowerCaseName.includes('wallet')) {
      return <Wallet className="h-5 w-5 text-muted-foreground" />;
    }
    return <HelpCircle className="h-5 w-5 text-muted-foreground" />;
  };

  return (
    <div className="container mx-auto p-4 sm:p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Statements</h1>
        <div className="flex items-center gap-2">
           <ExportButton minimal transactions={filteredTransactions} />
          <Button
            variant="outline"
            size="icon"
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
          >
            <ArrowDownUp className="h-4 w-4" />
          </Button>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64">
              <div className="space-y-4">
                <h4 className="font-medium leading-none">Filter by Asset</h4>
                <div className="space-y-2">
                  {assets.map((asset) => (
                    <div key={asset.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={asset.id}
                        checked={selectedAssets.includes(asset.id)}
                        onCheckedChange={() => handleAssetFilterChange(asset.id)}
                      />
                      <Label htmlFor={asset.id}>{asset.name}</Label>
                    </div>
                  ))}
                  {assets.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      No assets to filter.
                    </p>
                  )}
                </div>
                <Separator />
                 <div className="flex items-center space-x-2">
                    <Checkbox id="show-asset-creations" checked={showAssetCreations} onCheckedChange={(checked) => setShowAssetCreations(!!checked)} />
                    <Label htmlFor="show-asset-creations">Show Asset Creations</Label>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>
      
       <Link href="/" className="block mb-6">
          <Card 
              className='text-primary-foreground shadow-md transition-all duration-300 hover:shadow-lg'
              style={getBalanceCardStyle()}
          >
              <CardContent className="p-3 flex items-center justify-between">
                  <p className="text-sm font-medium">Total Balance</p>
                  {isClient && isInitialized ? (
                    <p className="text-lg font-bold tracking-tighter">
                        {formatCurrency(totalBalance)}
                    </p>
                  ) : (
                    <Skeleton className="h-6 w-24 bg-primary-foreground/20" />
                  )}
              </CardContent>
          </Card>
      </Link>

      <div className="space-y-3">
        {!isClient || !isInitialized ? (
          <>
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </>
        ) : filteredTransactions.length > 0 ? (
          filteredTransactions.map((t) => {
            const isIncome = t.type === 'income';
            const isAssetCreation = t.type === 'asset_creation';

            if (isAssetCreation) {
                return (
                     <div key={t.id} className="flex items-center gap-4 p-4 rounded-lg bg-card border border-l-4 border-l-blue-500">
                        <div className="p-2 rounded-full bg-blue-100 text-blue-700">
                           <PlusSquare className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold">{t.remarks}</p>
                           <p className="text-sm text-muted-foreground">Initial Balance</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-lg text-blue-600">
                             + {formatCurrency(t.amount)}
                          </p>
                          <p className="text-xs text-muted-foreground">{formatDate(t.date)}</p>
                        </div>
                      </div>
                )
            }

            return (
              <div
                key={t.id}
                className={cn(
                  'group flex flex-col md:flex-row items-start md:items-center gap-2 md:gap-4 p-4 rounded-lg bg-card border border-l-4',
                  isIncome ? 'border-l-green-500' : 'border-l-red-500',
                  t.isOrphaned && 'opacity-60'
                )}
              >
                <div className="flex items-center gap-4">
                    <div
                      className={`p-2 rounded-full ${
                        isIncome
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {isIncome ? (
                        <ArrowDown className="h-5 w-5" />
                      ) : (
                        <ArrowUp className="h-5 w-5" />
                      )}
                    </div>
                    <div className="flex-1 md:hidden">
                      <p className="font-semibold">{t.remarks || 'Transaction'}</p>
                       <div className="flex items-center gap-2">
                        {getAssetIcon(t.assetName)}
                        <p className="text-sm text-muted-foreground">
                          {t.assetName}
                        </p>
                      </div>
                    </div>
                </div>

                <div className="hidden md:flex flex-1 flex-col">
                  <p className="font-semibold">{t.remarks || 'Transaction'}</p>
                  <div className="flex items-center gap-2">
                    {getAssetIcon(t.assetName)}
                    <p className="text-sm text-muted-foreground">
                      {t.assetName}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between w-full md:w-auto">
                    <div className="text-right md:text-right ml-14 md:ml-0">
                      <p
                        className={`font-bold text-lg ${
                          isIncome ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        {isIncome ? '+' : '-'} {formatCurrency(t.amount)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(t.date)}
                      </p>
                    </div>
                    <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground" onClick={() => setEditingTransaction(t)}>
                            <Pencil className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-destructive/60 hover:text-destructive hover:bg-destructive/10">
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Transaction?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                       This action cannot be undone. This will permanently delete this transaction and update the asset balance.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => deleteTransaction(t.id)} className="bg-destructive hover:bg-destructive/90">
                                        Delete
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="flex flex-col items-center justify-center text-center py-10 border-2 border-dashed rounded-lg">
            <div className="p-4 bg-secondary rounded-full mb-4">
              <BookText className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No Transactions Yet</h3>
            <p className="text-muted-foreground mb-4">
              Your transaction history will appear here.
            </p>
            <Button asChild>
              <Link href="/">Record First Transaction</Link>
            </Button>
          </div>
        )}
      </div>
      {editingTransaction && (
          <EditTransactionDialog
            key={editingTransaction.id}
            transaction={editingTransaction}
            open={!!editingTransaction}
            onOpenChange={(open) => {
                if (!open) {
                    setEditingTransaction(null);
                }
            }}
          />
      )}
    </div>
  );
}
