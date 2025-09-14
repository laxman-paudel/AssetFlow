'use client';

import { useMemo, useState } from 'react';
import { useAssetFlow } from '@/lib/store';
import {
  ArrowDown,
  ArrowDownUp,
  ArrowUp,
  Filter,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';

export default function StatementPage() {
  const { transactions, assets, getAssetById, isInitialized } = useAssetFlow();
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
      return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
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
  
  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  
  const formatDate = (dateString: string) => {
      const date = new Date(dateString);
      return date.toLocaleString(undefined, {
          dateStyle: 'medium',
          timeStyle: 'short'
      });
  }

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
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div className="space-y-4">
      {!isInitialized ? (
          <>
            <Skeleton className="h-28 w-full" />
            <Skeleton className="h-28 w-full" />
            <Skeleton className="h-28 w-full" />
          </>
        ) : filteredTransactions.length > 0 ? (
          filteredTransactions.map((t) => {
            const asset = getAssetById(t.assetId);
            const isIncome = t.type === 'income';
            return (
              <Card key={t.id}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold">{t.remarks || 'Transaction'}</p>
                      <p className="text-sm text-muted-foreground">{asset?.name || 'Unknown Asset'}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(t.date)}</p>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold text-lg ${isIncome ? 'text-green-600' : 'text-red-600'}`}>
                        {isIncome ? '+' : '-'} {formatCurrency(t.amount)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        ) : (
          <Card className="text-center py-10">
            <CardContent>
              <p className="text-muted-foreground">No transactions found.</p>
              <p className="text-muted-foreground">Start by recording income or an expense.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
