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
      const storedCurrency = localStorage.getItem(CURRENCY_STORAGE_KEY);
      
      if (storedCurrency) {
        setCurrency(JSON.parse(storedCurrency));
        const storedAssets = localStorage.getItem(ASSETS_STORAGE_KEY);
        if (storedAssets) {
          setAssets(JSON.parse(storedAssets));
        }
        const storedTransactions = localStorage.getItem(TRANSACTIONS_STORAGE_KEY);
        if (storedTransactions) {
          setTransactions(JSON.parse(storedTransactions));
        }
         setIsInitialized(true);
      } else {
        // This block handles the case after a reset or for a new user
        setNeedsCurrencySetup(true);
        setCurrency('');
        setAssets([]);
        setTransactions([]);
        setIsInitialized(true);
      }
    } catch (error) {
      console.error('Failed to initialize app state from localStorage', error);
      toast({
        title: 'Initialization Error',
        description: 'Could not load your data. Starting fresh.',
        variant: 'destructive',
      });
      localStorage.removeItem(ASSETS_STORAGE_KEY);
      localStorage.removeItem(TRANSACTIONS_STORAGE_KEY);
      localStorage.removeItem(CURRENCY_STORAGE_KEY);
      setNeedsCurrencySetup(true);
      setIsInitialized(true);
    }
  }, [toast]);

  useEffect(() => {
    if (isInitialized && !needsCurrencySetup) {
      try {
        localStorage.setItem(ASSETS_STORAGE_KEY, JSON.stringify(assets));
      } catch (error) {
        console.error('Failed to save assets to localStorage', error);
      }
    }
  }, [assets, isInitialized, needsCurrencySetup]);

  useEffect(() => {
    if (isInitialized && !needsCurrencySetup) {
      try {
        localStorage.setItem(
          TRANSACTIONS_STORAGE_KEY,
          JSON.stringify(transactions)
        );
      } catch (error) {
        console.error('Failed to save transactions to localStorage', error);
      }
    }
  }, [transactions, isInitialized, needsCurrencySetup]);
  
  useEffect(() => {
    if (isInitialized && currency && !needsCurrencySetup) {
      try {
        localStorage.setItem(CURRENCY_STORAGE_KEY, JSON.stringify(currency));
      } catch (error) {
        console.error('Failed to save currency to localStorage', error);
      }
    }
  }, [currency, isInitialized, needsCurrencySetup]);

  const addAsset = useCallback((name: string, initialBalance: number) => {
    const newAsset: Asset = {
      id: crypto.randomUUID(),
      name,
      balance: initialBalance,
    };
    
    const newTransaction: Transaction = {
      id: crypto.randomUUID(),
      type: 'asset_creation',
      amount: initialBalance,
      assetId: newAsset.id,
      assetName: newAsset.name,
      date: new Date().toISOString(),
      remarks: `Asset "${newAsset.name}" created`,
    };

    setAssets((prev) => [...prev, newAsset]);
    setTransactions(prev => [newTransaction, ...prev]);

    toast({
      title: 'Asset Added',
      description: `New asset "${name}" has been created.`,
    });
  }, [toast]);
  
  const editAsset = useCallback((id: string, newName: string) => {
    const assetExists = assets.some(a => a.id === id);
    if (!assetExists) {
        toast({
            title: 'Edit Failed',
            description: 'Asset not found.',
            variant: 'destructive'
        });
        return;
    }

    setAssets(prevAssets => prevAssets.map(asset => {
        if (asset.id === id) {
            return { ...asset, name: newName };
        }
        return asset;
    }));

    setTransactions(prevTxs => prevTxs.map(t => {
        if (t.assetId === id) {
            return { ...t, assetName: newName };
        }
        return t;
    }));
    
    toast({
        title: 'Asset Updated',
        description: 'The asset has been successfully renamed.',
    });
}, [assets, toast]);

  const deleteAsset = useCallback((id: string) => {
    const assetToDelete = assets.find(asset => asset.id === id);
    if (!assetToDelete) return;
    
    setAssets((prev) => prev.filter((asset) => asset.id !== id));
    setTransactions(prev => 
      prev.map(t => 
        t.assetId === id ? { ...t, isOrphaned: true, assetName: t.assetName } : t
      )
    );
    toast({
      title: 'Asset Deleted',
      description: 'The asset and its balance have been removed. Transaction history is preserved.',
    });
  }, [assets, toast]);

  const addTransaction = useCallback(
    (
      type: 'income' | 'expenditure',
      amount: number,
      assetId: string,
      remarks: string
    ) => {
      const asset = assets.find(a => a.id === assetId);
      if (!asset) return;

      const newTransaction: Transaction = {
        id: crypto.randomUUID(),
        type,
        amount,
        assetId,
        assetName: asset.name,
        date: new Date().toISOString(),
        remarks,
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
    [assets, toast]
  );
  
  const editTransaction = useCallback((id: string, newAmount: number, newRemarks: string) => {
    const tx = transactions.find(t => t.id === id);
    if (!tx || tx.type === 'asset_creation') {
        toast({
            title: 'Edit Failed',
            description: 'Asset creation events cannot be edited.',
            variant: 'destructive'
        });
        return;
    }

    const amountDifference = newAmount - tx.amount;

    // Update asset balance
    setAssets(prevAssets => prevAssets.map(asset => {
        if (asset.id === tx.assetId) {
            const balanceAdjustment = tx.type === 'income' ? amountDifference : -amountDifference;
            return { ...asset, balance: asset.balance + balanceAdjustment };
        }
        return asset;
    }));

    // Update the transaction
    setTransactions(prevTxs => prevTxs.map(t => {
        if (t.id === id) {
            return { ...t, amount: newAmount, remarks: newRemarks, date: new Date().toISOString() };
        }
        return t;
    }));
    
    toast({
        title: 'Transaction Updated',
        description: 'The transaction has been successfully updated.',
    });
}, [transactions, toast]);


  const deleteTransaction = useCallback((id: string) => {
    const tx = transactions.find(t => t.id === id);
    if (!tx || tx.type === 'asset_creation') {
        toast({
            title: 'Deletion Failed',
            description: 'Asset creation events cannot be deleted.',
            variant: 'destructive'
        });
        return;
    };
    
    // Reverse the balance change
    setAssets(prevAssets => prevAssets.map(asset => {
        if (asset.id === tx.assetId) {
            const newBalance = tx.type === 'income'
                ? asset.balance - tx.amount
                : asset.balance + tx.amount;
            return { ...asset, balance: newBalance };
        }
        return asset;
    }));

    // Remove the transaction
    setTransactions(prevTxs => prevTxs.filter(t => t.id !== id));
    
    toast({
        title: 'Transaction Deleted',
        description: 'The transaction has been removed and the asset balance is updated.',
    });
}, [transactions, toast]);

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
    try {
        // Persist to localStorage first
        localStorage.setItem(CURRENCY_STORAGE_KEY, JSON.stringify(selectedCurrency));
        localStorage.setItem(ASSETS_STORAGE_KEY, JSON.stringify([]));
        localStorage.setItem(TRANSACTIONS_STORAGE_KEY, JSON.stringify([]));

        // Then update the state
        setCurrency(selectedCurrency);
        setAssets([]);
        setTransactions([]);
        setNeedsCurrencySetup(false);
      
        toast({
          title: 'Welcome!',
          description: `Your currency has been set to ${selectedCurrency}.`
        });
    } catch(error) {
       console.error('Failed to complete currency setup', error);
        toast({
            title: 'Setup Failed',
            description: 'There was an error during initial setup. Please refresh the page.',
            variant: 'destructive',
        });
    }
  };
  
  const value = {
    assets,
    transactions,
    addAsset,
    editAsset,
    deleteAsset,
    addTransaction,
    editTransaction,
    deleteTransaction,
    getAssetById,
    totalBalance,
    isInitialized,
    currency,
    setCurrency: handleSetCurrency
  };

  return (
    <AssetFlowContext.Provider value={value}>
      {children}
      <CurrencySetupDialog open={needsCurrencySetup} onCurrencySelect={completeCurrencySetup} />
    </AssetFlowContext.Provider>
  );
}
