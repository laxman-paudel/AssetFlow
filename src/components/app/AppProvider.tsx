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
  getDocs,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import type { Account, Transaction } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import Loading from '@/app/loading';
import { useRouter, usePathname } from 'next/navigation';
import CurrencySetupDialog from './CurrencySetupDialog';

interface AssetFlowState {
  user: User | null;
  accounts: Account[] | null;
  transactions: Transaction[] | null;
  addAccount: (name: string, initialBalance: number) => Promise<Account>;
  deleteAccount: (id: string) => Promise<void>;
  addTransaction: (
    type: 'income' | 'expenditure',
    amount: number,
    accountId: string,
    remarks: string
  ) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  totalBalance: number | null;
  isInitialized: boolean;
  currency: string | null;
}

const AssetFlowContext = createContext<AssetFlowState | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [needsCurrencySetup, setNeedsCurrencySetup] = useState(false);
  
  const [accounts, setAccounts] = useState<Account[] | null>(null);
  const [transactions, setTransactions] = useState<Transaction[] | null>(null);
  const [currency, setCurrency] = useState<string | null>(null);

  const { toast } = useToast();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user);
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          const userData = userDoc.data();
          setCurrency(userData.currency);
          setIsInitialized(true);
        } else {
          setNeedsCurrencySetup(true);
        }
      } else {
        setUser(null);
        setIsInitialized(true);
        setAccounts(null);
        setTransactions(null);
        setCurrency(null);
      }
    });

    return () => unsubscribe();
  }, []);
  
  useEffect(() => {
    if(isInitialized && !user && pathname !== '/auth') {
        router.push('/auth');
    }
  }, [isInitialized, user, pathname, router]);

  useEffect(() => {
    if (!user || !currency) return;

    const accountsQuery = query(collection(db, 'users', user.uid, 'accounts'));
    const accountsUnsubscribe = onSnapshot(accountsQuery, (snapshot) => {
      const fetchedAccounts: Account[] = [];
      snapshot.forEach((doc) => {
        fetchedAccounts.push({ id: doc.id, ...doc.data() } as Account);
      });
      setAccounts(fetchedAccounts);
    });

    const transactionsQuery = query(collection(db, 'users', user.uid, 'transactions'));
    const transactionsUnsubscribe = onSnapshot(transactionsQuery, (snapshot) => {
      const fetchedTransactions: Transaction[] = [];
       snapshot.forEach((doc) => {
        const data = doc.data();
        fetchedTransactions.push({ 
          id: doc.id,
          ...data,
          // Convert Firestore Timestamp to ISO string
          date: data.date?.toDate ? data.date.toDate().toISOString() : new Date().toISOString()
        } as Transaction);
      });
      setTransactions(fetchedTransactions);
    });

    return () => {
      accountsUnsubscribe();
      transactionsUnsubscribe();
    };
  }, [user, currency]);
  
  const addAccount = useCallback(async (name: string, initialBalance: number): Promise<Account> => {
    if (!user) throw new Error("User not authenticated");
    
    const batch = writeBatch(db);

    const newAccountRef = doc(collection(db, 'users', user.uid, 'accounts'));
    const newAccountData = { name, balance: initialBalance };
    batch.set(newAccountRef, newAccountData);

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

    await batch.commit();
    toast({
      title: 'Account Added',
      description: `New account "${name}" has been created.`,
    });

    return { id: newAccountRef.id, ...newAccountData };
  }, [user, toast]);
  
  const deleteAccount = useCallback(async (id: string) => {
    if (!user) throw new Error("User not authenticated");

    const batch = writeBatch(db);
    const accountRef = doc(db, 'users', user.uid, 'accounts', id);
    batch.delete(accountRef);
    
    const transactionsQuery = query(collection(db, 'users', user.uid, 'transactions'));
    const querySnapshot = await getDocs(transactionsQuery);

    querySnapshot.forEach(doc => {
      if (doc.data().accountId === id) {
        batch.update(doc.ref, { isOrphaned: true });
      }
    });

    await batch.commit();

    toast({
      title: 'Account Deleted',
      description: 'The account and its balance have been removed. Transaction history is preserved.',
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

  const deleteTransaction = useCallback(async (id: string) => {
    if (!user || !transactions || !accounts) throw new Error("Required data not available");

    const tx = transactions.find(t => t.id === id);
    if (!tx || tx.type === 'account_creation') {
      toast({
        title: 'Deletion Failed',
        description: 'Account creation events cannot be deleted.',
        variant: 'destructive'
      });
      return;
    }
    
    const batch = writeBatch(db);
    const txRef = doc(db, 'users', user.uid, 'transactions', id);
    batch.delete(txRef);

    const account = accounts.find(a => a.id === tx.accountId);
    if (account) {
      const accountRef = doc(db, 'users', user.uid, 'accounts', account.id);
      const newBalance = tx.type === 'income' ? account.balance - tx.amount : account.balance + tx.amount;
      batch.update(accountRef, { balance: newBalance });
    }

    await batch.commit();
    toast({
      title: 'Transaction Deleted',
      description: 'The transaction has been removed and the account balance is updated.',
    });
  }, [user, transactions, accounts, toast]);

  const totalBalance = useMemo(
    () => accounts?.reduce((sum, account) => sum + account.balance, 0) ?? null,
    [accounts]
  );
  
  const completeCurrencySetup = async (selectedCurrency: string) => {
    if (!user) return;
    try {
        const userDocRef = doc(db, 'users', user.uid);
        await setDoc(userDocRef, { currency: selectedCurrency, createdAt: serverTimestamp() });
        setCurrency(selectedCurrency);
        setNeedsCurrencySetup(false);
        
        // Create default accounts
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
    deleteTransaction,
    totalBalance,
    isInitialized,
    currency,
  };

  if (!isInitialized) {
    return <Loading />;
  }
  
  if (isInitialized && !user && pathname !== '/auth') {
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
