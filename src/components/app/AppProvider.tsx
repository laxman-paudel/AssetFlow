'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { AssetFlowContext } from '@/lib/store';
import type { Asset, Transaction } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

const ASSETS_STORAGE_KEY = 'assetflow-assets';
const TRANSACTIONS_STORAGE_KEY = 'assetflow-transactions';

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    try {
      const storedAssets = localStorage.getItem(ASSETS_STORAGE_KEY);
      const storedTransactions = localStorage.getItem(TRANSACTIONS_STORAGE_KEY);

      if (storedAssets) {
        setAssets(JSON.parse(storedAssets));
      } else {
        // Initialize with default assets if none are stored
        setAssets([
          { id: 'cash', name: 'Cash', balance: 1000 },
          { id: 'bank', name: 'Main Bank Account', balance: 5000 },
        ]);
      }

      if (storedTransactions) {
        setTransactions(JSON.parse(storedTransactions));
      }
    } catch (error) {
      console.error('Failed to load data from localStorage', error);
      toast({
        title: 'Error',
        description: 'Could not load saved data.',
        variant: 'destructive',
      });
    } finally {
      setIsInitialized(true);
    }
  }, [toast]);

  useEffect(() => {
    if (isInitialized) {
      try {
        localStorage.setItem(ASSETS_STORAGE_KEY, JSON.stringify(assets));
      } catch (error) {
        console.error('Failed to save assets to localStorage', error);
      }
    }
  }, [assets, isInitialized]);

  useEffect(() => {
    if (isInitialized) {
      try {
        localStorage.setItem(
          TRANSACTIONS_STORAGE_KEY,
          JSON.stringify(transactions)
        );
      } catch (error) {
        console.error('Failed to save transactions to localStorage', error);
      }
    }
  }, [transactions, isInitialized]);

  const addAsset = useCallback((name: string, initialBalance: number) => {
    const newAsset: Asset = {
      id: crypto.randomUUID(),
      name,
      balance: initialBalance,
    };
    setAssets((prev) => [...prev, newAsset]);
    toast({
      title: 'Asset Added',
      description: `New asset "${name}" has been created.`,
    });
  }, [toast]);

  const deleteAsset = useCallback((id: string) => {
    if (transactions.some(t => t.assetId === id)) {
        toast({
            title: 'Cannot Delete Asset',
            description: 'This asset has transactions associated with it and cannot be deleted.',
            variant: 'destructive',
        });
        return;
    }
    setAssets((prev) => prev.filter((asset) => asset.id !== id));
    toast({
      title: 'Asset Deleted',
      description: 'The asset has been successfully deleted.',
    });
  }, [toast, transactions]);

  const addTransaction = useCallback(
    (
      type: 'income' | 'expenditure',
      amount: number,
      assetId: string,
      remarks: string
    ) => {
      const newTransaction: Transaction = {
        id: crypto.randomUUID(),
        type,
        amount,
        assetId,
        remarks,
        date: new Date().toISOString(),
      };

      setTransactions((prev) => [newTransaction, ...prev]);
      setAssets((prev) =>
        prev.map((asset) => {
          if (asset.id === assetId) {
            const newBalance =
              type === 'income'
                ? asset.balance + amount
                : asset.balance - amount;
            return { ...asset, balance: newBalance };
          }
          return asset;
        })
      );
      toast({
        title: 'Transaction Recorded',
        description: `Your ${type} of ${amount.toFixed(2)} has been recorded.`,
      });
    },
    [toast]
  );
  
  const getAssetById = useCallback((id: string) => {
    return assets.find(a => a.id === id);
  }, [assets]);

  const totalBalance = useMemo(
    () => assets.reduce((sum, asset) => sum + asset.balance, 0),
    [assets]
  );

  const value = {
    assets,
    transactions,
    addAsset,
    deleteAsset,
    addTransaction,
    getAssetById,
    totalBalance,
    isInitialized,
  };

  return (
    <AssetFlowContext.Provider value={value}>
      {children}
    </AssetFlowContext.Provider>
  );
}
