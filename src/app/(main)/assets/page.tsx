'use client';

import { useState, useEffect } from 'react';
import { useAssetFlow } from '@/lib/store';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { PlusCircle, Trash2, Landmark, Wallet, CreditCard, HelpCircle, Pencil } from 'lucide-react';
import AccountDialog from '@/components/app/AccountDialog';
import { Skeleton } from '@/components/ui/skeleton';
import EditAccountDialog from '@/components/app/EditAccountDialog';
import { Account } from '@/lib/types';
import { useRouter } from 'next/navigation';

export default function AccountsPage() {
  const store = useAssetFlow();
  const [accounts, setAccounts] = useState<Account[] | null>(null);
  const [totalBalance, setTotalBalance] = useState<number | null>(null);
  const [currency, setCurrency] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const router = useRouter();
  
  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (store.isInitialized) {
      setAccounts(store.accounts);
      setTotalBalance(store.totalBalance);
      setCurrency(store.currency);
    }
  }, [store.isInitialized, store.accounts, store.totalBalance, store.currency]);

  const formatCurrency = (amount: number) => {
    if (!currency) return '...';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };
  
  const getAccountIcon = (accountName: string) => {
    const lowerCaseName = accountName.toLowerCase();
    if (lowerCaseName.includes('bank')) {
      return <Landmark className="h-6 w-6 text-muted-foreground" />;
    }
     if (lowerCaseName.includes('card') || lowerCaseName.includes('credit')) {
      return <CreditCard className="h-6 w-6 text-muted-foreground" />;
    }
    if (lowerCaseName.includes('cash') || lowerCaseName.includes('wallet')) {
      return <Wallet className="h-6 w-6 text-muted-foreground" />;
    }
    return <HelpCircle className="h-6 w-6 text-muted-foreground" />;
  };

  const getBalanceCardStyle = () => {
    if (totalBalance === null) return {};
    const maxAmount = 5000;
    const intensity = Math.min(Math.abs(totalBalance) / maxAmount, 1);

    if (totalBalance > 0) {
      const lightness = 80 - intensity * 30;
      return { backgroundColor: `hsl(120, 60%, ${lightness}%)` };
    }
    if (totalBalance < 0) {
      const lightness = 80 - intensity * 25;
      return { backgroundColor: `hsl(0, 70%, ${lightness}%)` };
    }
    return { backgroundColor: 'hsl(210, 80%, 70%)' };
  };

  return (
    <div className="container mx-auto p-4 sm:p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold tracking-tight">My Accounts</h1>
        <Button onClick={() => setDialogOpen(true)} className='h-11'>
          <PlusCircle className="mr-2 h-4 w-4" />
          New Account
        </Button>
      </div>
      
      {isClient && accounts !== null && accounts.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center py-20 border-2 border-dashed rounded-lg">
          <div className="p-4 bg-primary/10 rounded-full mb-4">
            <Wallet className="h-12 w-12 text-primary" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Create Your First Account</h3>
          <p className="text-muted-foreground mb-6 max-w-sm">
            Start by adding a bank account, credit card, or cash to track your balance.
          </p>
          <Button onClick={() => setDialogOpen(true)} size="lg">
            <PlusCircle className="mr-2 h-5 w-5" />
            Add First Account
          </Button>
        </div>
      ) : (
        <>
          <div className="block mb-6">
              <Card 
                  className='text-primary-foreground shadow-md transition-all duration-300 hover:shadow-lg cursor-pointer'
                  style={isClient && totalBalance !== null ? getBalanceCardStyle() : {}}
                  onClick={() => router.push('/')}
              >
                  <CardContent className="p-3 flex items-center justify-between">
                      <p className="text-sm font-medium">Total Balance</p>
                      {isClient && totalBalance !== null && currency ? (
                        <p className="text-lg font-bold tracking-tighter">
                            {formatCurrency(totalBalance)}
                        </p>
                      ) : (
                        <Skeleton className="h-6 w-24 bg-primary-foreground/20" />
                      )}
                  </CardContent>
              </Card>
          </div>
          <div className="space-y-4">
            {!isClient || accounts === null ? (
              <>
                <Skeleton className="h-28 w-full" />
                <Skeleton className="h-28 w-full" />
              </>
            ) : (
              accounts.map((account) => (
                <Card key={account.id} className="transition-all hover:shadow-lg hover:-translate-y-1 duration-300 group border-l-4 border-l-primary/20 hover:border-l-primary/60">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <div className="flex items-center gap-4">
                       {getAccountIcon(account.name)}
                       <div>
                          <CardTitle className="tracking-tight">{account.name}</CardTitle>
                          <CardDescription>Available Balance</CardDescription>
                       </div>
                    </div>
                    <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground" onClick={() => setEditingAccount(account)}>
                            <Pencil className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                               <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-destructive/60 hover:text-destructive hover:bg-destructive/10">
                                  <Trash2 className="h-4 w-4" />
                               </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                       This action cannot be undone. This will permanently delete your account and its balance. The transaction history will be preserved.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => store.deleteAccount(account.id)} className="bg-destructive hover:bg-destructive/90">
                                        Delete
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                  </CardHeader>
                  <CardContent className="pl-16">
                    {isClient && currency ? (
                      <p className="text-3xl font-bold tracking-tight">
                        {formatCurrency(account.balance)}
                      </p>
                    ) : (
                      <Skeleton className="h-8 w-32" />
                    )}
                  </CardContent>
                </Card>
              ))
            )}
            {isClient && accounts !== null && accounts.length > 0 && (
                <div className="flex flex-col items-center justify-center text-center py-10 border-2 border-dashed rounded-lg">
                    <div className="p-4 bg-secondary rounded-full mb-4">
                        <PlusCircle className="h-10 w-10 text-muted-foreground" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">Add Another Account</h3>
                    <p className="text-muted-foreground mb-4">You can add more accounts, like credit cards or other savings.</p>
                    <Button onClick={() => setDialogOpen(true)}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Create New Account
                    </Button>
                </div>
            )}
          </div>
        </>
      )}

      <AccountDialog open={dialogOpen} onOpenChange={setDialogOpen} />
      {editingAccount && (
        <EditAccountDialog
          key={editingAccount.id}
          account={editingAccount}
          open={!!editingAccount}
          onOpenChange={(open) => !open && setEditingAccount(null)}
        />
      )}
    </div>
  );
}
