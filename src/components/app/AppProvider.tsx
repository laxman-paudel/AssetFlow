'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useMemo,
  useCallback,
} from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  collection,
  query,
  onSnapshot,
  writeBatch,
  serverTimestamp,
  getDocs,
  deleteDoc,
  updateDoc,
} from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import type { Account, Transaction, TransactionType } from '@/lib/types';
import { useToast } from '@/components/ui/use-toast';
import Loading from '@/app/loading';
import { useRouter, usePathname } from 'next/navigation';
import CurrencySetupDialog from './CurrencySetupDialog';

interface AssetFlowState {
  user: User | null;
  accounts: Account[] | null;
  transactions: Transaction[] | null;
  addAccount: (name: string, initialBalance: number) => Promise<Account>;
  deleteAccount: (accountId: string) => Promise<void>;
  addTransaction: (
    type: 'income' | 'expenditure',
    amount: number,
    accountId: string,
    remarks: string
  ) => Promise<void>;
  resetApplication: () => Promise<void>;
  totalBalance: number | null;
  isInitialized: boolean;
  isLoading: boolean;
  currency: string | null;
}

const AssetFlowContext = createContext<AssetFlowState | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const [needsCurrencySetup, setNeedsCurrencySetup] = useState(false);
  
  const [accounts, setAccounts] = useState<Account[] | null>(null);
  const [transactions, setTransactions] = useState<Transaction[] | null>(null);
  const [currency, setCurrency] = useState<string | null>(null);

  const { toast } = useToast();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      if (pathname !== '/auth') {
        router.push('/auth');
      }
      setAccounts(null);
      setTransactions(null);
      setCurrency(null);
      setIsInitialized(false);
      return;
    }

    const userDocRef = doc(db, 'users', user.uid);
    const unsub = onSnapshot(userDocRef, (doc) => {
        if (doc.exists()) {
            const userData = doc.data();
            if (userData.currency) {
                setCurrency(userData.currency);
                setNeedsCurrencySetup(false);
            } else {
                setNeedsCurrencySetup(true);
            }
        } else {
            setNeedsCurrencySetup(true);
        }
    }, (error) => {
        console.error("Error fetching user document:", error);
        toast({ title: 'Error', description: 'Could not fetch user profile.', variant: 'destructive' });
    });

    return () => unsub();
  }, [user, isLoading, pathname, router, toast]);

  useEffect(() => {
    if (!user || needsCurrencySetup) {
      setIsInitialized(false);
      return;
    };
    if (currency) {
      setIsInitialized(true);
    }
  }, [user, currency, needsCurrencySetup]);


  useEffect(() => {
    if (!isInitialized || !user) return;

    const accountsQuery = query(collection(db, 'users', user.uid, 'accounts'));
    const accountsUnsubscribe = onSnapshot(accountsQuery, (snapshot) => {
      const fetchedAccounts: Account[] = [];
      snapshot.forEach((doc) => {
        fetchedAccounts.push({ id: doc.id, ...doc.data() } as Account);
      });
      setAccounts(fetchedAccounts);
    }, (error) => {
      console.error("Error fetching accounts:", error);
      toast({ title: 'Error', description: 'Could not fetch accounts.', variant: 'destructive' });
    });

    const transactionsQuery = query(collection(db, 'users', user.uid, 'transactions'));
    const transactionsUnsubscribe = onSnapshot(transactionsQuery, (snapshot) => {
      const fetchedTransactions: Transaction[] = [];
       snapshot.forEach((doc) => {
        const data = doc.data();
        fetchedTransactions.push({ 
          id: doc.id,
          ...data,
          date: data.date?.toDate ? data.date.toDate().toISOString() : new Date().toISOString()
        } as Transaction);
      });
      setTransactions(fetchedTransactions);
    }, (error) => {
        console.error("Error fetching transactions:", error);
        toast({ title: 'Error', description: 'Could not fetch transactions.', variant: 'destructive' });
    });

    return () => {
      accountsUnsubscribe();
      transactionsUnsubscribe();
    };
  }, [isInitialized, user, toast]);
  
  const addAccount = useCallback(async (name: string, initialBalance: number): Promise<Account> => {
    if (!user) throw new Error("User not authenticated");
    
    const batch = writeBatch(db);

    const newAccountRef = doc(collection(db, 'users', user.uid, 'accounts'));
    const newAccountData = { name, balance: initialBalance };
    batch.set(newAccountRef, newAccountData);

    if (initialBalance > 0) {
      const newTransactionRef = doc(collection(db, 'users', user.uid, 'transactions'));
      const newTransactionData = {
        type: 'account_creation',
        amount: initialBalance,
        accountId: newAccountRef.id,
        accountName: name,
        date: serverTimestamp(),
        remarks: `Account "${name}" created`,
      };
      batch.set(newTransactionRef, newTransactionData);
    }

    await batch.commit();
    toast({
      title: 'Account Added',
      description: `New account "${name}" has been created.`,
    });

    return { id: newAccountRef.id, ...newAccountData };
  }, [user, toast]);
  
  const deleteAccount = useCallback(async (accountId: string) => {
    if (!user) throw new Error("User not authenticated");
    
    // Deleting an account just removes the account doc.
    // Transactions will remain and be shown as 'orphaned'.
    await deleteDoc(doc(db, 'users', user.uid, 'accounts', accountId));

    toast({
      title: 'Account Deleted',
      description: 'The account has been removed.',
    });
  }, [user, toast]);

  const addTransaction = useCallback(async (type: 'income' | 'expenditure', amount: number, accountId: string, remarks: string) => {
    if (!user || !accounts) throw new Error("User or accounts not available");

    const account = accounts.find(a => a.id === accountId);
    if (!account) throw new Error("Account not found");
    
    const batch = writeBatch(db);
    
    const accountRef = doc(db, 'users', user.uid, 'accounts', accountId);
    const newBalance = type === 'income' ? account.balance + amount : account.balance - amount;
    batch.update(accountRef, { balance: newBalance });
    
    const newTransactionRef = doc(collection(db, 'users', user.uid, 'transactions'));
    batch.set(newTransactionRef, {
      type,
      amount,
      accountId,
      accountName: account.name,
      date: serverTimestamp(),
      remarks,
    });
    
    await batch.commit();
    toast({
      title: 'Transaction Recorded',
      description: `Your ${type} of ${amount.toFixed(2)} has been recorded.`,
    });
  }, [user, accounts, toast]);
  
  const resetApplication = async () => {
    if (!user) {
      toast({ title: 'Error', description: 'You must be logged in to reset.', variant: 'destructive' });
      return;
    }
    
    const batch = writeBatch(db);
    const transactionsRef = collection(db, 'users', user.uid, 'transactions');
    const accountsRef = collection(db, 'users', user.uid, 'accounts');
    const userDocRef = doc(db, 'users', user.uid);
    
    try {
      const [transactionsSnap, accountsSnap] = await Promise.all([
        getDocs(transactionsRef),
        getDocs(accountsRef)
      ]);
      
      transactionsSnap.forEach(doc => batch.delete(doc.ref));
      accountsSnap.forEach(doc => batch.delete(doc.ref));
      
      // Instead of deleting the user doc, we just clear the currency to re-trigger the setup flow.
      batch.update(userDocRef, { currency: null });

      await batch.commit();
      
      auth.signOut();

      toast({ title: 'Application Reset', description: 'Your data has been cleared.' });
      setNeedsCurrencySetup(true); // Manually trigger setup dialog

    } catch (error) {
       console.error("Error resetting application: ", error);
       toast({ title: 'Reset Failed', description: 'Could not clear your data. Please try again.', variant: 'destructive' });
    }
  };

  const totalBalance = useMemo(() => {
    if (accounts === null) return null;
    return accounts.reduce((sum, account) => sum + account.balance, 0);
  }, [accounts]);
  
  const completeCurrencySetup = async (selectedCurrency: string) => {
    if (!user) return;
    try {
        const userDocRef = doc(db, 'users', user.uid);
        await setDoc(userDocRef, { currency: selectedCurrency }, { merge: true });
      
        setCurrency(selectedCurrency);
        setNeedsCurrencySetup(false);
        
        await addAccount("Cash", 0);
        await addAccount("Primary Bank", 0);
      
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
    user,
    accounts,
    transactions,
    addAccount,
    deleteAccount,
    addTransaction,
    resetApplication,
    totalBalance,
    isInitialized,
    isLoading,
    currency,
  };

  if (isLoading || (!isInitialized && pathname !== '/auth')) {
    return <Loading />;
  }

  return (
    <AssetFlowContext.Provider value={value}>
      {children}
      <CurrencySetupDialog open={needsCurrencySetup} onCurrencySelect={completeCurrencySetup} />
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
