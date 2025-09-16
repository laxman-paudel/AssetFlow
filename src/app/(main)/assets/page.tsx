'use client';

import { useState } from 'react';
import { useAssetFlow } from '@/components/app/AppProvider';
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
} from '@/components/ui/alert-dialog';
import { PlusCircle, Landmark, Wallet, CreditCard, HelpCircle, Edit, Trash2, BookText } from 'lucide-react';
import AccountDialog from '@/components/app/AccountDialog';
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter } from 'next/navigation';
import type { Account } from '@/lib/types';
import EditAccountDialog from '@/components/app/EditAccountDialog';
import { cn } from '@/lib/utils';
import { useCountUp } from '@/hooks/useCountUp';


export default function AccountsPage() {
  const { accounts, currency, totalBalance, isInitialized, deleteAccount } = useAssetFlow();
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [accountToEdit, setAccountToEdit] = useState<Account | null>(null);
  const [accountToDelete, setAccountToDelete] = useState<Account | null>(null);
  const [expandedAccountId, setExpandedAccountId] = useState<string | null>(null);
  
  const router = useRouter();

  const animatedTotalBalance = useCountUp(totalBalance ?? 0);
  
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

  const handleAccountClick = (accountId: string) => {
    setExpandedAccountId(prevId => prevId === accountId ? null : accountId);
  }

  const handleDelete = () => {
    if (accountToDelete) {
      deleteAccount(accountToDelete.id);
      setAccountToDelete(null);
      setExpandedAccountId(null);
    }
  };
  
  const handleShowTransactions = (accountId: string) => {
    router.push(`/statement?accountId=${accountId}`);
  };

  const accountsLoaded = isInitialized && accounts !== null;

  return (
    <>
      <div className="container mx-auto p-4 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <h1 className="text-2xl font-bold tracking-tight">My Accounts</h1>
          <Button onClick={() => setDialogOpen(true)} className='h-11'>
            <PlusCircle className="mr-2 h-4 w-4" />
            New Account
          </Button>
        </div>
        
        {accountsLoaded && accounts.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-20 border-2 border-dashed rounded-lg">
            <div className="p-4 bg-primary/10 rounded-full mb-4">
              <Wallet className="h-12 w-12 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Create Your First Account</h3>
            <p className="text-muted-foreground mb-6 max-w-sm">
              You've been given a Cash and Bank account, but you can add more.
            </p>
            <Button onClick={() => setDialogOpen(true)} size="lg">
              <PlusCircle className="mr-2 h-5 w-5" />
              Add Account
            </Button>
          </div>
        ) : (
          <>
            <div className="block mb-6">
                <Card 
                    className='text-primary-foreground shadow-md transition-smooth hover:shadow-lg cursor-pointer'
                    style={getBalanceCardStyle()}
                    onClick={() => router.push('/')}
                >
                    <CardContent className="p-3 flex items-center justify-between">
                        <p className="text-sm font-medium">Total Balance</p>
                        {accountsLoaded && totalBalance !== null ? (
                          <p className="text-lg font-bold tracking-tighter">
                              {formatCurrency(animatedTotalBalance)}
                          </p>
                        ) : (
                          <Skeleton className="h-6 w-24 bg-primary-foreground/20" />
                        )}
                    </CardContent>
                </Card>
            </div>
            <div className="space-y-4">
              {!accountsLoaded ? (
                Array.from({ length: 2 }).map((_, i) => (
                  <Skeleton key={i} className="h-28 w-full" />
                ))
              ) : (
                accounts.map((account) => (
                  <div key={account.id}>
                    <Card 
                      className={cn(
                          "transition-all duration-300 border-l-4 overflow-hidden border-l-primary/20",
                          expandedAccountId === account.id ? 'bg-muted/50 border-l-primary/60' : 'hover:bg-muted/50 hover:shadow-lg hover:-translate-y-1 hover:border-l-primary/60'
                      )}
                    >
                      <div className="cursor-pointer" onClick={() => handleAccountClick(account.id)}>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                          <div className="flex items-center gap-4">
                            {getAccountIcon(account.name)}
                            <div>
                                <CardTitle className="tracking-tight text-base sm:text-xl">{account.name}</CardTitle>
                                <CardDescription>Available Balance</CardDescription>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="pl-16">
                            <p className="text-xl sm:text-3xl font-bold tracking-tight">
                              {formatCurrency(account.balance)}
                            </p>
                        </CardContent>
                      </div>

                      {expandedAccountId === account.id && (
                      <div className="bg-muted/50 border-t transition-all">
                          <div className="px-2 sm:px-4 py-2 flex justify-evenly">
                              <Button variant="ghost" size="sm" onClick={() => handleShowTransactions(account.id)}>
                                  <BookText className="mr-2 h-4 w-4" />
                                  Transactions
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => setAccountToEdit(account)}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit
                              </Button>
                              <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => setAccountToDelete(account)}>
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
                              </Button>
                          </div>
                      </div>
                      )}
                    </Card>
                  </div>
                ))
              )}
              {accountsLoaded && accounts.length > 0 && (
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
      </div>

      {accountToEdit && (
        <EditAccountDialog
            key={accountToEdit.id}
            account={accountToEdit}
            open={!!accountToEdit}
            onOpenChange={(isOpen) => !isOpen && setAccountToEdit(null)}
        />
      )}
      
      <AlertDialog open={!!accountToDelete} onOpenChange={(isOpen) => !isOpen && setAccountToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this account and all of its associated transactions.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
