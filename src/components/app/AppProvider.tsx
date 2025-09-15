'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { AssetFlowContext } from '@/lib/store';
import type { Account, Transaction } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import CurrencySetupDialog from './CurrencySetupDialog';

const ACCOUNTS_STORAGE_KEY = 'assetflow-accounts';
const TRANSACTIONS_STORAGE_KEY = 'assetflow-transactions';
const CURRENCY_STORAGE_KEY = 'assetflow-currency';

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [needsCurrencySetup, setNeedsCurrencySetup] = useState(false);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [currency, setCurrency] = useState<string>('');
  const { toast } = useToast();

  useEffect(() => {
    try {
      const storedCurrency = localStorage.getItem(CURRENCY_STORAGE_KEY);
      
      if (storedCurrency) {
        setCurrency(JSON.parse(storedCurrency));
        const storedAccounts = localStorage.getItem(ACCOUNTS_STORAGE_KEY);
        if (storedAccounts) {
          setAccounts(JSON.parse(storedAccounts));
        }
        const storedTransactions = localStorage.getItem(TRANSACTIONS_STORAGE_KEY);
        if (storedTransactions) {
          setTransactions(JSON.parse(storedTransactions));
        }
      } else {
        setNeedsCurrencySetup(true);
      }
    } catch (error) {
      console.error('Failed to initialize app state from localStorage', error);
      toast({
        title: 'Initialization Error',
        description: 'Could not load your data. Please clear your site data and try again.',
        variant: 'destructive',
      });
      setNeedsCurrencySetup(true);
    } finally {
        setIsInitialized(true);
    }
  }, [toast]);

  useEffect(() => {
    if (isInitialized) {
      try {
        localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(accounts));
        localStorage.setItem(TRANSACTIONS_STORAGE_KEY, JSON.stringify(transactions));
        if (currency) {
            localStorage.setItem(CURRENCY_STORAGE_KEY, JSON.stringify(currency));
        }
      } catch (error) {
        console.error('Failed to save state to localStorage', error);
      }
    }
  }, [accounts, transactions, currency, isInitialized]);


  const addAccount = useCallback((name: string, initialBalance: number, showToast = true): Account => {
    const newAccount: Account = {
      id: crypto.randomUUID(),
      name,
      balance: initialBalance,
    };
    
    const newTransaction: Transaction = {
      id: crypto.randomUUID(),
      type: 'account_creation',
      amount: initialBalance,
      accountId: newAccount.id,
      accountName: newAccount.name,
      date: new Date().toISOString(),
      remarks: `Account "${newAccount.name}" created`,
    };

    setAccounts((prev) => [...prev, newAccount]);
    setTransactions(prev => [newTransaction, ...prev]);

    if (showToast) {
        toast({
          title: 'Account Added',
          description: `New account "${name}" has been created.`,
        });
    }
    return newAccount;
  }, [toast]);
  
  const editAccount = useCallback((id: string, newName: string) => {
    const accountExists = accounts.some(a => a.id === id);
    if (!accountExists) {
        toast({
            title: 'Edit Failed',
            description: 'Account not found.',
            variant: 'destructive'
        });
        return;
    }

    setAccounts(prevAccounts => prevAccounts.map(account => {
        if (account.id === id) {
            return { ...account, name: newName };
        }
        return account;
    }));

    setTransactions(prevTxs => prevTxs.map(t => {
        if (t.accountId === id) {
            return { ...t, accountName: newName };
        }
        return t;
    }));
    
    toast({
        title: 'Account Updated',
        description: 'The account has been successfully renamed.',
    });
}, [accounts, toast]);

  const deleteAccount = useCallback((id: string) => {
    const accountToDelete = accounts.find(account => account.id === id);
    if (!accountToDelete) return;
    
    setAccounts((prev) => prev.filter((account) => account.id !== id));
    setTransactions(prev => 
      prev.map(t => 
        t.accountId === id ? { ...t, isOrphaned: true, accountName: t.accountName } : t
      )
    );
    toast({
      title: 'Account Deleted',
      description: 'The account and its balance have been removed. Transaction history is preserved.',
    });
  }, [accounts, toast]);

  const addTransaction = useCallback(
    (
      type: 'income' | 'expenditure',
      amount: number,
      accountId: string,
      remarks: string
    ) => {
      const account = accounts.find(a => a.id === accountId);
      if (!account) return;

      const newTransaction: Transaction = {
        id: crypto.randomUUID(),
        type,
        amount,
        accountId,
        accountName: account.name,
        date: new Date().toISOString(),
        remarks,
      };

      setTransactions((prev) => [newTransaction, ...prev]);
      setAccounts((prev) =>
        prev.map((account) => {
          if (account.id === accountId) {
            const newBalance =
              type === 'income'
                ? account.balance + amount
                : account.balance - amount;
            return { ...account, balance: newBalance };
          }
          return account;
        })
      );
      toast({
        title: 'Transaction Recorded',
        description: `Your ${type} of ${amount.toFixed(2)} has been recorded.`,
      });
    },
    [accounts, toast]
  );
  
  const editTransaction = useCallback((id: string, newAmount: number, newRemarks: string) => {
    const tx = transactions.find(t => t.id === id);
    if (!tx || tx.type === 'account_creation') {
        toast({
            title: 'Edit Failed',
            description: 'Account creation events cannot be edited.',
            variant: 'destructive'
        });
        return;
    }

    const amountDifference = newAmount - tx.amount;

    // Update account balance
    setAccounts(prevAccounts => prevAccounts.map(account => {
        if (account.id === tx.accountId) {
            const balanceAdjustment = tx.type === 'income' ? amountDifference : -amountDifference;
            return { ...account, balance: account.balance + balanceAdjustment };
        }
        return account;
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
    if (!tx || tx.type === 'account_creation') {
        toast({
            title: 'Deletion Failed',
            description: 'Account creation events cannot be deleted.',
            variant: 'destructive'
        });
        return;
    };
    
    // Reverse the balance change
    setAccounts(prevAccounts => prevAccounts.map(account => {
        if (account.id === tx.accountId) {
            const newBalance = tx.type === 'income'
                ? account.balance - tx.amount
                : account.balance + tx.amount;
            return { ...account, balance: newBalance };
        }
        return account;
    }));

    // Remove the transaction
    setTransactions(prevTxs => prevTxs.filter(t => t.id !== id));
    
    toast({
        title: 'Transaction Deleted',
        description: 'The transaction has been removed and the account balance is updated.',
    });
}, [transactions, toast]);

  const getAccountById = useCallback((id: string) => {
    return accounts.find(a => a.id === id);
  }, [accounts]);

  const totalBalance = useMemo(
    () => accounts.reduce((sum, account) => sum + account.balance, 0),
    [accounts]
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
        setCurrency(selectedCurrency);
        setAccounts([]);
        setTransactions([]);
        setNeedsCurrencySetup(false);

        // Create default accounts without showing toast
        addAccount("Cash", 0, false);
        addAccount("Primary Bank Balance", 0, false);
      
        toast({
          title: 'Welcome!',
          description: `Your currency has been set to ${selectedCurrency}. Let's get started!`
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
    accounts,
    transactions,
    addAccount,
    editAccount,
    deleteAccount,
    addTransaction,
    editTransaction,
    deleteTransaction,
    getAccountById,
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
