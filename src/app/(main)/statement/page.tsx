'use client';

import { useMemo, useState } from 'react';
import { useAssetFlow } from '@/lib/store';
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
} from 'lucide-react';
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

export default function StatementPage() {
  const { transactions, assets, isInitialized, currency } = useAssetFlow();
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedAssets, setSelectedAssets] = useState<string[]>([]);

  const filteredTransactions = useMemo(() => {
    let items = [...transactions];

    if (selectedAssets.length > 0) {
      items = items.filter((t) => selectedAssets.includes(t.assetId));
    }

    items.sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return sortOrder === 'asc' ? dateA - dateB : dateB - a;
    });

    return items;
  }, [transactions, sortOrder, selectedAssets]);

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
  }
  
  const formatDate = (dateString: string) => {
      const date = new Date(dateString);
      return date.toLocaleString(undefined, {
          dateStyle: 'medium',
          timeStyle: 'short'
      });
  }

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
                    {assets.map(asset => (
                         <div key={asset.id} className="flex items-center space-x-2">
                            <Checkbox id={asset.id} checked={selectedAssets.includes(asset.id)} onCheckedChange={() => handleAssetFilterChange(asset.id)} />
                            <Label htmlFor={asset.id}>{asset.name}</Label>
                        </div>
                    ))}
                    {assets.length === 0 && <p className='text-sm text-muted-foreground'>No assets to filter.</p>}
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div className="space-y-3">
      {!isInitialized ? (
          <>
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </>
        ) : filteredTransactions.length > 0 ? (
          filteredTransactions.map((t) => {
            const isIncome = t.type === 'income';
            return (
              <div key={t.id} className={cn("flex items-center gap-4 p-4 rounded-lg bg-card border", t.isOrphaned && "opacity-60")}>
                <div className={`p-2 rounded-full ${isIncome ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {isIncome ? <ArrowDown className="h-5 w-5" /> : <ArrowUp className="h-5 w-5" />}
                </div>
                <div className="flex-1">
                  <p className="font-semibold">{t.remarks || 'Transaction'}</p>
                  <div className='flex items-center gap-2'>
                    {getAssetIcon(t.assetName)}
                    <p className="text-sm text-muted-foreground">{t.assetName}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-bold text-lg ${isIncome ? 'text-green-600' : 'text-red-600'}`}>
                    {isIncome ? '+' : '-'} {formatCurrency(t.amount)}
                  </p>
                  <p className="text-xs text-muted-foreground">{formatDate(t.date)}</p>
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
            <p className="text-muted-foreground mb-4">Your transaction history will appear here.</p>
            <Button asChild>
                <Link href="/">Record First Transaction</Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
