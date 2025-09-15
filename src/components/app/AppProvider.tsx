'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useMemo,
  useCallback,
} from 'react';
import type { Account, Transaction, EditableTransaction } from '@/lib/types';
import { useToast } from '@/components/ui/use-toast';
import Loading from '@/app/loading';
import CurrencySetupDialog from './CurrencySetupDialog';

// Local storage keys
const CURRENCY_KEY = 'assetflow-currency';
const ACCOUNTS_KEY = 'assetflow-accounts';
const TRANSACTIONS_KEY = 'assetflow-transactions';

interface AssetFlowState {
  accounts: Account[] | null;
  transactions: Transaction[] | null;
  addAccount: (name: string, initialBalance: number) => Promise<Account>;
  editAccount: (accountId: string, updates: { name: string; balance: number }) => Promise<void>;
  deleteAccount: (accountId: string) => Promise<void>;
  addTransaction: (
    type: 'income' | 'expenditure',
    amount: number,
    accountId: string,
    remarks: string
  ) => Promise<void>;
  editTransaction: (transactionId: string, updates: EditableTransaction) => Promise<void>;
  deleteTransaction: (transactionId: string) => Promise<void>;
  resetApplication: () => Promise<void>;
  changeCurrency: (newCurrency: string) => void;
  totalBalance: number | null;
  isInitialized: boolean;
  currency: string | null;
}

const AssetFlowContext = createContext<AssetFlowState | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [needsCurrencySetup, setNeedsCurrencySetup] = useState(false);
  
  const [accounts, setAccounts] = useState<Account[] | null>(null);
  const [transactions, setTransactions] = useState<Transaction[] | null>(null);
  const [currency, setCurrency] = useState<string | null>(null);

  const { toast } = useToast();

  // Load data from local storage on initial mount
  useEffect(() => {
    try {
      const storedCurrency = localStorage.getItem(CURRENCY_KEY);
      if (storedCurrency) {
        setCurrency(JSON.parse(storedCurrency));
        
        const storedAccounts = localStorage.getItem(ACCOUNTS_KEY);
        setAccounts(storedAccounts ? JSON.parse(storedAccounts) : []);
        
        const storedTransactions = localStorage.getItem(TRANSACTIONS_KEY);
        setTransactions(storedTransactions ? JSON.parse(storedTransactions) : []);
        
      } else {
        setNeedsCurrencySetup(true);
      }
    } catch (error) {
      console.error("Failed to load data from local storage:", error);
      toast({ title: "Error", description: "Could not load your data. It might be corrupted.", variant: "destructive" });
      setNeedsCurrencySetup(true); // Force setup if loading fails
    } finally {
      setIsInitialized(true);
    }
  }, [toast]);
  
  // Persist state to local storage whenever it changes
  useEffect(() => {
    if (!isInitialized) return;
    try {
      if (currency) localStorage.setItem(CURRENCY_KEY, JSON.stringify(currency));
      if (accounts) localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
      if (transactions) localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(transactions));
    } catch (error) {
      console.error("Failed to save data to local storage:", error);
      toast({ title: "Save Error", description: "Could not save your changes.", variant: "destructive" });
    }
  }, [currency, accounts, transactions, isInitialized, toast]);

  const addAccount = useCallback(async (name: string, initialBalance: number): Promise<Account> => {
    const newAccount: Account = { 
      id: new Date().toISOString() + Math.random(), 
      name, 
      balance: initialBalance 
    };
    
    setAccounts(prev => [...(prev || []), newAccount]);

    if (initialBalance !== 0) {
      const newTransaction: Transaction = {
        id: new Date().toISOString() + Math.random(),
        type: 'account_creation',
        amount: initialBalance,
        accountId: newAccount.id,
        accountName: name,
        date: new Date().toISOString(),
        remarks: `Account "${name}" created`,
      };
      setTransactions(prev => [...(prev || []), newTransaction]);
    }
    
    toast({
      title: 'Account Added',
      description: `New account "${name}" has been created.`,
    });

    return newAccount;
  }, [toast]);
  
  const editAccount = useCallback(async (accountId: string, updates: { name: string; balance: number }) => {
    setAccounts(prev => 
      prev?.map(a => a.id === accountId ? { ...a, name: updates.name, balance: updates.balance } : a) || []
    );
    
    // Update account name in all related transactions
    setTransactions(prev => 
      prev?.map(t => t.accountId === accountId ? { ...t, accountName: updates.name } : t) || []
    );
    
    toast({
      title: 'Account Updated',
      description: `The account has been updated successfully.`,
    });
  }, [toast]);
  
  const deleteAccount = useCallback(async (accountId: string) => {
    setAccounts(prev => prev?.filter(a => a.id !== accountId) || []);
    setTransactions(prev => prev?.filter(t => t.accountId !== accountId) || []);
    
    toast({
      title: 'Account Deleted',
      description: 'The account and all its transactions have been removed.',
      variant: 'destructive',
    });
  }, [toast]);

  const addTransaction = useCallback(async (type: 'income' | 'expenditure', amount: number, accountId: string, remarks: string) => {
    const account = accounts?.find(a => a.id === accountId);
    if (!account) throw new Error("Account not found");

    const newBalance = type === 'income' ? account.balance + amount : account.balance - amount;
    
    setAccounts(prev => prev?.map(a => a.id === accountId ? { ...a, balance: newBalance } : a) || []);
    
    const newTransaction: Transaction = {
      id: new Date().toISOString() + Math.random(),
      type,
      amount,
      accountId,
      accountName: account.name,
      date: new Date().toISOString(),
      remarks,
    };
    
    setTransactions(prev => [...(prev || []), newTransaction]);
    
    toast({
      title: 'Transaction Recorded',
      description: `Your ${type} of ${amount.toFixed(2)} has been recorded.`,
    });
  }, [accounts, toast]);
  
  const deleteTransaction = useCallback(async (transactionId: string) => {
    setTransactions(prev => {
        const newTransactions = prev || [];
        const transactionToDelete = newTransactions.find(t => t.id === transactionId);
        if (!transactionToDelete || !accounts) return prev;

        setAccounts(accs => {
            const newAccounts = accs || [];
            const accountToUpdate = newAccounts.find(a => a.id === transactionToDelete.accountId);
            if (!accountToUpdate) return accs;
            
            let newBalance = accountToUpdate.balance;
            if (transactionToDelete.type === 'income') {
                newBalance -= transactionToDelete.amount;
            } else if (transactionToDelete.type === 'expenditure') {
                newBalance += transactionToDelete.amount;
            } else if (transactionToDelete.type === 'account_creation') {
                // If we delete an account creation, we should also delete the account
                // This might be too destructive, let's just adjust balance.
                // For now, let's prevent deletion of account_creation transactions to be safe.
                // Or let's revert the balance change
                newBalance -= transactionToDelete.amount;
            }

            return newAccounts.map(a => a.id === transactionToDelete.accountId ? {...a, balance: newBalance} : a);
        });

        return newTransactions.filter(t => t.id !== transactionId);
    });

    toast({
        title: "Transaction Deleted",
        description: "The transaction has been removed.",
        variant: "destructive"
    });
  }, [accounts, toast]);

  const editTransaction = useCallback(async (transactionId: string, updates: EditableTransaction) => {
      setTransactions(prev => {
          const newTransactions = prev || [];
          const originalTransaction = newTransactions.find(t => t.id === transactionId);

          if (!originalTransaction || !accounts) return prev;

          const updatedAccount = accounts.find(a => a.id === updates.accountId);
          if (!updatedAccount) return prev;
          
          setAccounts(accs => {
              let newAccounts = [...(accs || [])];
              
              // Revert old transaction
              const originalAccount = newAccounts.find(a => a.id === originalTransaction.accountId);
              if (originalAccount) {
                  let originalBalance = originalAccount.balance;
                   if (originalTransaction.type === 'income') {
                      originalBalance -= originalTransaction.amount;
                  } else if (originalTransaction.type === 'expenditure') {
                      originalBalance += originalTransaction.amount;
                  }
                  newAccounts = newAccounts.map(a => a.id === originalTransaction.accountId ? {...a, balance: originalBalance} : a);
              }

              // Apply new transaction
              let newBalance = newAccounts.find(a => a.id === updates.accountId)!.balance;
              if (originalTransaction.type === 'income') {
                  newBalance += updates.amount;
              } else if (originalTransaction.type === 'expenditure') {
                  newBalance -= updates.amount;
              }
              newAccounts = newAccounts.map(a => a.id === updates.accountId ? {...a, balance: newBalance} : a);

              return newAccounts;
          });

          return newTransactions.map(t => t.id === transactionId ? {
              ...t,
              amount: updates.amount,
              accountId: updates.accountId,
              accountName: updatedAccount.name,
              remarks: updates.remarks,
              date: updates.date,
          } : t);
      });

      toast({
          title: "Transaction Updated",
          description: "Your transaction has been successfully updated.",
      });

  }, [accounts, toast]);
  
  const resetApplication = useCallback(async () => {
    try {
      localStorage.removeItem(CURRENCY_KEY);
      localStorage.removeItem(ACCOUNTS_KEY);
      localStorage.removeItem(TRANSACTIONS_KEY);
      
      toast({ title: 'Application Reset', description: 'Your data has been cleared.' });

      // Wait a moment for the toast to be visible before reloading
      setTimeout(() => {
        window.location.reload();
      }, 500);

    } catch (error) {
       console.error("Error resetting application: ", error);
       toast({ title: 'Reset Failed', description: 'Could not clear your data. Please try again.', variant: 'destructive' });
    }
  }, [toast]);

  const changeCurrency = useCallback((newCurrency: string) => {
    setCurrency(newCurrency);
    toast({
        title: 'Currency Updated',
        description: `Your primary currency has been changed to ${newCurrency}.`,
    });
  }, [toast]);

  const totalBalance = useMemo(() => {
    if (accounts === null) return null;
    return accounts.reduce((sum, account) => sum + account.balance, 0);
  }, [accounts]);
  
  const completeCurrencySetup = async (selectedCurrency: string) => {
    try {
        setCurrency(selectedCurrency);
        setNeedsCurrencySetup(false);
        
        // Setup initial state
        const cashAccount: Account = { id: 'cash', name: 'Cash', balance: 0 };
        const bankAccount: Account = { id: 'bank', name: 'Primary Bank', balance: 0 };
        setAccounts([cashAccount, bankAccount]);
        setTransactions([]);
      
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

  const value: AssetFlowState = {
    accounts,
    transactions,
    addAccount,
    editAccount,
    deleteAccount,
    addTransaction,
    editTransaction,
    deleteTransaction,
    resetApplication,
    changeCurrency,
    totalBalance,
    isInitialized,
    currency,
  };

  if (!isInitialized) {
    return <Loading />;
  }
  
  return (
    <AssetFlowContext.Provider value={value}>
      {children}
      {needsCurrencySetup && (
        <CurrencySetupDialog 
            open={needsCurrencySetup} 
            onCurrencySelect={completeCurrencySetup} 
        />
      )}
    </AssetFlowContext.Provider>
  );
}

export function useAssetFlow() {
  const context = useContext(AssetFlowContext);
  if (context === undefined) {
    throw new Error('useAssetFlow must be used within an AppProvider');
  }
  return context;
}
