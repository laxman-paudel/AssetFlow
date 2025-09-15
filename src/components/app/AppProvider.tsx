'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useMemo,
  useCallback,
} from 'react';
import type { Account, Transaction, EditableTransaction, Category, CategoryType } from '@/lib/types';
import { useToast } from '@/components/ui/use-toast';
import Loading from '@/app/loading';
import CurrencySetupDialog from './CurrencySetupDialog';
import { useRouter } from 'next/navigation';

// Local storage keys
const CURRENCY_KEY = 'assetflow-currency';
const ACCOUNTS_KEY = 'assetflow-accounts';
const TRANSACTIONS_KEY = 'assetflow-transactions';
const CUSTOM_CATEGORIES_KEY = 'assetflow-custom-categories';
const CATEGORIES_ENABLED_KEY = 'assetflow-categories-enabled';

interface AssetFlowState {
  accounts: Account[] | null;
  transactions: Transaction[] | null;
  customCategories: Category[] | null;
  categoriesEnabled: boolean;
  addAccount: (name: string, initialBalance: number) => Promise<Account>;
  editAccount: (accountId: string, updates: { name: string; balance: number }) => Promise<void>;
  deleteAccount: (accountId: string) => Promise<void>;
  addTransaction: (
    type: 'income' | 'expenditure',
    amount: number,
    accountId: string,
    remarks: string,
    category?: string
  ) => Promise<void>;
  addTransfer: (
    amount: number,
    fromAccountId: string,
    toAccountId: string,
    remarks: string
  ) => Promise<void>;
  editTransaction: (transactionId: string, updates: EditableTransaction) => Promise<void>;
  deleteTransaction: (transactionId: string) => Promise<void>;
  addCustomCategory: (name: string, type: CategoryType) => Promise<Category>;
  editCustomCategory: (categoryId: string, updates: { name: string }) => Promise<void>;
  deleteCustomCategory: (categoryId: string) => Promise<void>;
  toggleCategories: (enabled: boolean) => void;
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
  const [customCategories, setCustomCategories] = useState<Category[] | null>(null);
  const [categoriesEnabled, setCategoriesEnabled] = useState(true);

  const { toast } = useToast();
  const router = useRouter();

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

        const storedCustomCategories = localStorage.getItem(CUSTOM_CATEGORIES_KEY);
        setCustomCategories(storedCustomCategories ? JSON.parse(storedCustomCategories) : []);
        
        const storedCategoriesEnabled = localStorage.getItem(CATEGORIES_ENABLED_KEY);
        setCategoriesEnabled(storedCategoriesEnabled ? JSON.parse(storedCategoriesEnabled) : true);

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
      if (customCategories) localStorage.setItem(CUSTOM_CATEGORIES_KEY, JSON.stringify(customCategories));
      localStorage.setItem(CATEGORIES_ENABLED_KEY, JSON.stringify(categoriesEnabled));
    } catch (error) {
      console.error("Failed to save data to local storage:", error);
      toast({ title: "Save Error", description: "Could not save your changes.", variant: "destructive" });
    }
  }, [currency, accounts, transactions, customCategories, categoriesEnabled, isInitialized, toast]);

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
      prev?.map(t => {
        if (t.accountId === accountId) {
            t.accountName = updates.name;
        }
        if (t.toAccountId === accountId) {
            t.toAccountName = updates.name;
        }
        return t;
    }) || []
    );
    
    toast({
      title: 'Account Updated',
      description: `The account has been updated successfully.`,
    });
  }, [toast]);
  
  const deleteAccount = useCallback(async (accountId: string) => {
    setAccounts(prev => prev?.filter(a => a.id !== accountId) || []);
    // Also delete transactions to/from this account.
    setTransactions(prev => prev?.filter(t => t.accountId !== accountId && t.toAccountId !== accountId) || []);
    
    toast({
      title: 'Account Deleted',
      description: 'The account and all its transactions have been removed.',
      variant: 'destructive',
    });
  }, [toast]);

  const addTransaction = useCallback(async (type: 'income' | 'expenditure', amount: number, accountId: string, remarks: string, category?: string) => {
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
      category,
    };
    
    setTransactions(prev => [...(prev || []), newTransaction]);
    
    toast({
      title: 'Transaction Recorded',
      description: `Your ${type} of ${amount.toFixed(2)} has been recorded.`,
    });
  }, [accounts, toast]);

    const addTransfer = useCallback(async (amount: number, fromAccountId: string, toAccountId: string, remarks: string) => {
        const fromAccount = accounts?.find(a => a.id === fromAccountId);
        const toAccount = accounts?.find(a => a.id === toAccountId);
        if (!fromAccount || !toAccount) throw new Error("Account not found");

        setAccounts(prev => prev?.map(a => {
            if (a.id === fromAccountId) return { ...a, balance: a.balance - amount };
            if (a.id === toAccountId) return { ...a, balance: a.balance + amount };
            return a;
        }) || []);
        
        const newTransaction: Transaction = {
            id: new Date().toISOString() + Math.random(),
            type: 'transfer',
            amount,
            accountId: fromAccountId,
            accountName: fromAccount.name,
            toAccountId: toAccountId,
            toAccountName: toAccount.name,
            date: new Date().toISOString(),
            remarks,
        };
        
        setTransactions(prev => [...(prev || []), newTransaction]);
        
        toast({
            title: 'Transfer Recorded',
            description: `Transfer of ${amount.toFixed(2)} from ${fromAccount.name} to ${toAccount.name} has been recorded.`,
        });
    }, [accounts, toast]);
  
  const deleteTransaction = useCallback(async (transactionId: string) => {
    setTransactions(prev => {
        const newTransactions = prev || [];
        const transactionToDelete = newTransactions.find(t => t.id === transactionId);
        if (!transactionToDelete || !accounts) return prev;

        setAccounts(accs => {
            const newAccounts = accs || [];
            
            let accountToUpdate;
            let newBalance;

            switch(transactionToDelete.type) {
                case 'income':
                    accountToUpdate = newAccounts.find(a => a.id === transactionToDelete.accountId);
                    if (accountToUpdate) {
                        newBalance = accountToUpdate.balance - transactionToDelete.amount;
                        return newAccounts.map(a => a.id === transactionToDelete.accountId ? {...a, balance: newBalance} : a);
                    }
                    break;
                case 'expenditure':
                    accountToUpdate = newAccounts.find(a => a.id === transactionToDelete.accountId);
                     if (accountToUpdate) {
                        newBalance = accountToUpdate.balance + transactionToDelete.amount;
                        return newAccounts.map(a => a.id === transactionToDelete.accountId ? {...a, balance: newBalance} : a);
                    }
                    break;
                case 'account_creation':
                     accountToUpdate = newAccounts.find(a => a.id === transactionToDelete.accountId);
                     if (accountToUpdate) {
                        newBalance = accountToUpdate.balance - transactionToDelete.amount;
                        return newAccounts.map(a => a.id === transactionToDelete.accountId ? {...a, balance: newBalance} : a);
                    }
                    break;
                case 'transfer':
                    const fromAccount = newAccounts.find(a => a.id === transactionToDelete.accountId);
                    const toAccount = newAccounts.find(a => a.id === transactionToDelete.toAccountId);
                    if(fromAccount && toAccount) {
                         return newAccounts.map(a => {
                            if (a.id === fromAccount.id) return {...a, balance: a.balance + transactionToDelete.amount};
                            if (a.id === toAccount.id) return {...a, balance: a.balance - transactionToDelete.amount};
                            return a;
                        });
                    }
                    break;
            }

            return accs;
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
          
          setAccounts(accs => {
              let newAccounts = [...(accs || [])];
              
              // Revert old transaction effect
              switch(originalTransaction.type) {
                case 'income':
                    newAccounts = newAccounts.map(a => a.id === originalTransaction.accountId ? {...a, balance: a.balance - originalTransaction.amount} : a);
                    break;
                case 'expenditure':
                    newAccounts = newAccounts.map(a => a.id === originalTransaction.accountId ? {...a, balance: a.balance + originalTransaction.amount} : a);
                    break;
                case 'transfer':
                    newAccounts = newAccounts.map(a => {
                        if (a.id === originalTransaction.accountId) return {...a, balance: a.balance + originalTransaction.amount};
                        if (a.id === originalTransaction.toAccountId) return {...a, balance: a.balance - originalTransaction.amount};
                        return a;
                    });
                    break;
              }

              // Apply new transaction effect
              const updatedAccount = accounts.find(a => a.id === updates.accountId);
              switch(originalTransaction.type) {
                  case 'income':
                      newAccounts = newAccounts.map(a => a.id === updates.accountId ? {...a, balance: a.balance + updates.amount} : a);
                      break;
                  case 'expenditure':
                      newAccounts = newAccounts.map(a => a.id === updates.accountId ? {...a, balance: a.balance - updates.amount} : a);
                      break;
                  case 'transfer':
                      newAccounts = newAccounts.map(a => {
                        if (a.id === updates.accountId) return {...a, balance: a.balance - updates.amount};
                        if (a.id === updates.toAccountId) return {...a, balance: a.balance + updates.amount};
                        return a;
                    });
                    break;
              }

              return newAccounts;
          });

          return newTransactions.map(t => {
            if (t.id === transactionId) {
                const updatedAccount = accounts.find(a => a.id === updates.accountId);
                const updatedToAccount = t.type === 'transfer' ? accounts.find(a => a.id === updates.toAccountId) : undefined;
                return {
                    ...t,
                    amount: updates.amount,
                    accountId: updates.accountId,
                    accountName: updatedAccount?.name || t.accountName,
                    remarks: updates.remarks,
                    date: updates.date,
                    category: updates.category,
                    toAccountId: updates.toAccountId,
                    toAccountName: updatedToAccount?.name,
                };
            }
            return t;
          });
      });

      toast({
          title: "Transaction Updated",
          description: "Your transaction has been successfully updated.",
      });

  }, [accounts, toast]);

    const addCustomCategory = useCallback(async (name: string, type: CategoryType): Promise<Category> => {
        const newCategory: Category = {
            id: new Date().toISOString() + Math.random(),
            name,
            type,
            icon: () => null, // Icon is handled in getCategoryById
        };
        
        setCustomCategories(prev => [...(prev || []), newCategory]);

        toast({
            title: 'Category Added',
            description: `New category "${name}" has been created.`,
        });

        return newCategory;
    }, [toast]);
    
    const editCustomCategory = useCallback(async (categoryId: string, updates: { name: string }) => {
        setCustomCategories(prev => prev?.map(c => c.id === categoryId ? { ...c, name: updates.name } : c) || []);
        toast({
            title: 'Category Updated',
            description: `The category has been renamed to "${updates.name}".`,
        });
    }, [toast]);

    const deleteCustomCategory = useCallback(async (categoryId: string) => {
        setCustomCategories(prev => prev?.filter(c => c.id !== categoryId) || []);
        // Remove this category from any transactions that use it
        setTransactions(prev => prev?.map(t => t.category === categoryId ? { ...t, category: undefined } : t) || []);
        toast({
            title: 'Category Deleted',
            description: 'The custom category has been removed.',
            variant: 'destructive',
        });
    }, [toast]);

    const toggleCategories = useCallback((enabled: boolean) => {
        setCategoriesEnabled(enabled);
        toast({
            title: `Categories ${enabled ? 'Enabled' : 'Disabled'}`,
            description: `Transaction categorization has been turned ${enabled ? 'on' : 'off'}.`,
        });
    }, [toast]);

  const resetApplication = useCallback(async () => {
    try {
      localStorage.removeItem(CURRENCY_KEY);
      localStorage.removeItem(ACCOUNTS_KEY);
      localStorage.removeItem(TRANSACTIONS_KEY);
      localStorage.removeItem(CUSTOM_CATEGORIES_KEY);
      localStorage.removeItem(CATEGORIES_ENABLED_KEY);
      
      toast({ title: 'Application Reset', description: 'Your data has been cleared.' });

      // Wait a moment for the toast to be visible before redirecting
      setTimeout(() => {
        window.location.href = '/';
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
        setCustomCategories([]);
        setCategoriesEnabled(true);

        router.push('/');
      
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
    customCategories,
    categoriesEnabled,
    addAccount,
    editAccount,
    deleteAccount,
    addTransaction,
    addTransfer,
    editTransaction,
    deleteTransaction,
    addCustomCategory,
    editCustomCategory,
    deleteCustomCategory,
    toggleCategories,
    resetApplication,
    changeCurrency,
    totalBalance,
    isInitialized,
    currency,
  };

  if (!isInitialized) {
    return <Loading />;
  }
  
  if (needsCurrencySetup) {
    return (
      <AppProviderShell>
        <CurrencySetupDialog 
            open={needsCurrencySetup} 
            onCurrencySelect={completeCurrencySetup} 
        />
        {children}
      </AppProviderShell>
    );
  }
  
  return (
    <AssetFlowContext.Provider value={value}>
      {children}
    </AssetFlowContext.Provider>
  );
}

// A shell provider that can show children content (blurred)
// This is used for the currency setup, so the dialog appears over the app
function AppProviderShell({ children }: { children: React.ReactNode }) {
    const value: AssetFlowState = {
        accounts: [],
        transactions: [],
        customCategories: [],
        categoriesEnabled: true,
        addAccount: async () => new Promise(() => {}),
        editAccount: async () => {},
        deleteAccount: async () => {},
        addTransaction: async () => {},
        addTransfer: async () => {},
        editTransaction: async () => {},
        deleteTransaction: async () => {},
        addCustomCategory: async () => new Promise(() => {}),
        editCustomCategory: async () => {},
        deleteCustomCategory: async () => {},
        toggleCategories: () => {},
        resetApplication: async () => {},
        changeCurrency: () => {},
        totalBalance: 0,
        isInitialized: true,
        currency: null,
    };

    return (
        <AssetFlowContext.Provider value={value}>
            <div style={{ filter: 'blur(4px)' }}>
                {children}
            </div>
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
