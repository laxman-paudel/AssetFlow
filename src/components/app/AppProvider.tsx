'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { AssetFlowContext } from '@/lib/store';
import type { Asset, Transaction } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import CurrencySetupDialog from './CurrencySetupDialog';

const ASSETS_STORAGE_KEY = 'assetflow-assets';
const TRANSACTIONS_STORAGE_KEY = 'assetflow-transactions';
const CURRENCY_STORAGE_KEY = 'assetflow-currency';

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [needsCurrencySetup, setNeedsCurrencySetup] = useState(false);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [currency, setCurrency] = useState<string>('');
  const { toast } = useToast();

  useEffect(() => {
    try {
      const storedAssets = localStorage.getItem(ASSETS_STORAGE_KEY);
      const storedTransactions = localStorage.getItem(TRANSACTIONS_STORAGE_KEY);
      const storedCurrency = localStorage.getItem(CURRENCY_STORAGE_KEY);

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
      
      if (storedCurrency) {
        setCurrency(JSON.parse(storedCurrency));
        setIsInitialized(true);
      } else {
        setNeedsCurrencySetup(true);
      }
    } catch (error) {
      console.error('Failed to load data from localStorage', error);
      toast({
        title: 'Error',
        description: 'Could not load saved data.',
        variant: 'destructive',
      });
      setIsInitialized(true); // Still initialize to avoid blocking UI
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
  
  useEffect(() => {
    if (isInitialized && currency) {
      try {
        localStorage.setItem(CURRENCY_STORAGE_KEY, JSON.stringify(currency));
      } catch (error) {
        console.error('Failed to save currency to localStorage', error);
      }
    }
  }, [currency, isInitialized]);

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
    setAssets((prev) => prev.filter((asset) => asset.id !== id));
    toast({
      title: 'Asset Deleted',
      description: 'The asset and its balance have been removed. Transaction history is preserved.',
    });
  }, [toast]);

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
  
  const handleSetCurrency = useCallback((newCurrency: string) => {
    setCurrency(newCurrency);
    toast({
        title: 'Currency Updated',
        description: `Currency has been set to ${newCurrency}.`
    });
  }, [toast]);
  
  const completeCurrencySetup = (selectedCurrency: string) => {
    setCurrency(selectedCurrency);
    setNeedsCurrencySetup(false);
    setIsInitialized(true);
     toast({
        title: 'Currency Set',
        description: `Your currency has been set to ${selectedCurrency}.`
    });
  };

  const value = {
    assets,
    transactions,
    addAsset,
    deleteAsset,
    addTransaction,
    getAssetById,
    totalBalance,
    isInitialized,
    currency,
    setCurrency: handleSetCurrency
  };

  return (
    <AssetFlowContext.Provider value={value}>
      {isInitialized ? children : null}
      <CurrencySetupDialog open={needsCurrencySetup} onCurrencySelect={completeCurrencySetup} />
    </AssetFlowContext.Provider>
  );
}
