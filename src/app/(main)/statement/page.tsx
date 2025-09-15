'use client';

import { useMemo, useState, useEffect, Suspense } from 'react';
import { useAssetFlow } from '@/components/app/AppProvider';
import {
  ArrowDown,
  ArrowDownUp,
  ArrowUp,
  Filter,
  Landmark,
  Wallet,
  CreditCard,
  HelpCircle,
  BookText,
  PlusSquare,
  Trash2,
  Edit,
  ArrowRightLeft,
  Search,
  Calendar as CalendarIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useRouter, useSearchParams } from 'next/navigation';
import { Separator } from '@/components/ui/separator';
import { Calendar } from '@/components/ui/calendar';
import { format, startOfMonth, subMonths, startOfYear, endOfDay } from 'date-fns';
import type { Transaction } from '@/lib/types';
import EditTransactionDialog from '@/components/app/EditTransactionDialog';
import { useCountUp } from '@/hooks/useCountUp';
import { getCategoryById } from '@/lib/categories';
import type { DateRange } from 'react-day-picker';

function StatementPageContent() {
  const {
    transactions,
    accounts,
    totalBalance,
    currency,
    isInitialized,
    deleteTransaction,
  } = useAssetFlow();

  const router = useRouter();
  const searchParams = useSearchParams();

  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);
  const [showAccountCreations, setShowAccountCreations] = useState(false);
  const [transactionToEdit, setTransactionToEdit] = useState<Transaction | null>(null);
  const [transactionToDelete, setTransactionToDelete] = useState<Transaction | null>(null);
  const [expandedTransactionId, setExpandedTransactionId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [dateFilterLabel, setDateFilterLabel] = useState('All Time');


  useEffect(() => {
    const accountIdFromQuery = searchParams.get('accountId');
    if (accountIdFromQuery) {
      setSelectedAccounts([accountIdFromQuery]);
      setShowAccountCreations(true);
      // Optional: remove the query param from URL after applying it
      // router.replace('/statement', { scroll: false });
    }
  }, [searchParams, router]);
  
  const animatedTotalBalance = useCountUp(totalBalance ?? 0);

  const filteredTransactions = useMemo(() => {
    if (!transactions) return [];
    let items = [...transactions];

    if (!showAccountCreations) {
      items = items.filter((t) => t.type !== 'account_creation');
    }

    if (selectedAccounts.length > 0) {
      items = items.filter((t) => {
        if (t.accountId) {
          if (selectedAccounts.includes(t.accountId)) return true;
        }
        if (t.toAccountId) {
            if (selectedAccounts.includes(t.toAccountId)) return true;
        }
        return false;
      });
    }

    if (searchTerm) {
        items = items.filter(t => t.remarks?.toLowerCase().includes(searchTerm.toLowerCase()));
    }

    if (dateRange?.from) {
        const fromDate = dateRange.from.getTime();
        const toDate = dateRange.to ? endOfDay(dateRange.to).getTime() : new Date().getTime();
        items = items.filter(t => {
            const tDate = new Date(t.date).getTime();
            return tDate >= fromDate && tDate <= toDate;
        })
    }

    items.sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    });

    return items;
  }, [transactions, sortOrder, selectedAccounts, showAccountCreations, searchTerm, dateRange]);

  const handleAccountFilterChange = (accountId: string) => {
    setSelectedAccounts((prev) =>
      prev.includes(accountId)
        ? prev.filter((id) => id !== accountId)
        : [...prev, accountId]
    );
  };

  const setDateFilter = (preset: 'all' | 'month' | '3months' | 'year') => {
      const today = new Date();
      switch(preset) {
          case 'month':
              setDateRange({from: startOfMonth(today), to: today});
              setDateFilterLabel('This Month');
              break;
          case '3months':
              setDateRange({from: subMonths(today, 3), to: today});
              setDateFilterLabel('Last 3 Months');
              break;
          case 'year':
              setDateRange({from: startOfYear(today), to: today});
              setDateFilterLabel('This Year');
              break;
          case 'all':
              setDateRange(undefined);
              setDateFilterLabel('All Time');
              break;
      }
  };
  
  useEffect(() => {
    if (dateRange?.from && dateRange?.to) {
        if (format(dateRange.from, 'PPP') === format(dateRange.to, 'PPP')) {
            setDateFilterLabel(format(dateRange.from, 'PPP'));
        } else {
            setDateFilterLabel(`${format(dateRange.from, 'LLL d')} - ${format(dateRange.to, 'LLL d, y')}`);
        }
    } else if (dateRange?.from) {
         setDateFilterLabel(`${format(dateRange.from, 'LLL d, y')} - Present`);
    }
  }, [dateRange]);


  const handleTransactionClick = (transactionId: string) => {
    setExpandedTransactionId(prevId => prevId === transactionId ? null : transactionId);
  }

  const formatCurrency = (amount: number) => {
    if (currency === null) return '...';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const formatAmount = (amount: number) => {
    if (currency === null) return '...';
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
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

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, 'MMM d, yyyy, h:mm a');
    } catch {
      return 'Invalid date';
    }
  };

  const getAccountIcon = (accountName?: string) => {
    if (!accountName) {
      return <HelpCircle className="h-5 w-5 text-muted-foreground" />;
    }
    const lowerCaseName = accountName.toLowerCase();
    if (lowerCaseName.includes('bank')) {
      return <Landmark className="h-5 w-5 text-muted-foreground" />;
    }
    if (lowerCaseName.includes('card') || lowerCaseName.includes('credit')) {
      return <CreditCard className="h-5 w-5 text-muted-foreground" />;
    }
    if (lowerCaseName.includes('cash') || lowerCaseName.includes('wallet')) {
      return <Wallet className="h-5 w-5 text-muted-foreground" />;
    }
    return <HelpCircle className="h-5 w-5 text-muted-foreground" />;
  };

  const handleDelete = () => {
    if (transactionToDelete) {
      deleteTransaction(transactionToDelete.id);
      setTransactionToDelete(null);
      setExpandedTransactionId(null);
    }
  };

  const transactionsLoaded = isInitialized && filteredTransactions !== null;
  const accountsLoaded = isInitialized && accounts !== null;

  return (
    <>
      <div className="container mx-auto p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <h1 className="text-2xl font-bold">Statements</h1>
          <div className="flex items-center gap-2">
            <div className='relative w-full sm:w-auto'>
                <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
                <Input 
                    placeholder='Search remarks...'
                    className='pl-9 w-full sm:w-64'
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
             <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className='w-full sm:w-auto min-w-[150px] justify-start'>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    <span className='truncate'>{dateFilterLabel}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onClick={() => setDateFilter('all')}>All Time</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setDateFilter('month')}>This Month</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setDateFilter('3months')}>Last 3 Months</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setDateFilter('year')}>This Year</DropdownMenuItem>
                <DropdownMenuSeparator />
                 <Popover>
                    <PopoverTrigger asChild>
                        <Button variant='ghost' className='w-full justify-start font-normal'>Custom Range...</Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="end">
                        <Calendar
                        initialFocus
                        mode="range"
                        defaultMonth={dateRange?.from}
                        selected={dateRange}
                        onSelect={setDateRange}
                        numberOfMonths={2}
                        />
                    </PopoverContent>
                </Popover>
              </DropdownMenuContent>
            </DropdownMenu>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="icon">
                  <Filter className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64">
                <div className="space-y-4">
                  <h4 className="font-medium leading-none">Filter by Account</h4>
                  <div className="space-y-2">
                    {accountsLoaded && accounts && accounts.map((account) => (
                      <div key={account.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={account.id}
                          checked={selectedAccounts.includes(account.id)}
                          onCheckedChange={() => handleAccountFilterChange(account.id)}
                        />
                        <Label htmlFor={account.id}>{account.name}</Label>
                      </div>
                    ))}
                    {accountsLoaded && accounts?.length === 0 && (
                      <p className="text-sm text-muted-foreground">
                        No accounts to filter.
                      </p>
                    )}
                    {!accountsLoaded && <Skeleton className="h-10 w-full" />}
                  </div>
                  <Separator />
                  <div className="flex items-center space-x-2">
                    <Checkbox id="show-account-creations" checked={showAccountCreations} onCheckedChange={(checked) => setShowAccountCreations(!!checked)} />
                    <Label htmlFor="show-account-creations">Show Account Creations</Label>
                  </div>
                   <Separator />
                    <div className='flex items-center justify-between'>
                       <Label>Sort Order</Label>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                            >
                            <ArrowDownUp className="mr-2 h-4 w-4" />
                            {sortOrder === 'desc' ? 'Newest First' : 'Oldest First'}
                        </Button>
                    </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <div className="block mb-6">
          <Card
            className='text-primary-foreground shadow-md transition-smooth hover:shadow-lg cursor-pointer'
            style={getBalanceCardStyle()}
            onClick={() => router.push('/')}
          >
            <CardContent className="p-3 flex items-center justify-between">
              <p className="text-sm font-medium">Total Balance</p>
              {transactionsLoaded && totalBalance !== null ? (
                <p className="text-lg font-bold tracking-tighter">
                  {formatCurrency(animatedTotalBalance)}
                </p>
              ) : (
                <Skeleton className="h-6 w-24 bg-primary-foreground/20" />
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-3">
          {!transactionsLoaded ? (
            Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)
          ) : filteredTransactions.length > 0 ? (
            filteredTransactions.map((t) => {
              const isIncome = t.type === 'income';
              const isAccountCreation = t.type === 'account_creation';
              const isTransfer = t.type === 'transfer';
              const account = accounts?.find(a => a.id === t.accountId);
              const toAccount = accounts?.find(a => a.id === t.toAccountId);
              const category = t.category ? getCategoryById(t.category) : null;
              const CategoryIcon = category?.icon;

              if (isAccountCreation) {
                return (
                  <div key={t.id} className="flex items-center gap-4 p-4 rounded-lg bg-card border border-l-4 border-l-blue-500">
                    <div className="p-2 rounded-full bg-blue-100 text-blue-700">
                      <PlusSquare className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold">{t.remarks}</p>
                      <p className="text-sm text-muted-foreground">Initial Balance</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg text-blue-600">
                        + {formatAmount(t.amount)}
                      </p>
                      <p className="text-xs text-muted-foreground">{formatDate(t.date)}</p>
                    </div>
                  </div>
                )
              }

              if (isTransfer) {
                return (
                     <Card
                        key={t.id}
                        className={cn(
                        'transition-all duration-200 border-l-4 overflow-hidden border-l-purple-500',
                        expandedTransactionId === t.id ? 'bg-muted/50' : 'hover:bg-muted/50'
                        )}
                    >
                        <div className='p-4 relative cursor-pointer' onClick={() => handleTransactionClick(t.id)}>
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex flex-1 items-center gap-4 truncate">
                                    <div className="p-2 rounded-full bg-purple-100 text-purple-700">
                                        <ArrowRightLeft className="h-5 w-5" />
                                    </div>
                                    <div className="flex-1 truncate">
                                        <p className="font-semibold truncate">{t.remarks || 'Transfer'}</p>
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <p className="truncate">{t.accountName} to {t.toAccountName}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right flex-shrink-0">
                                    <p className="font-bold text-lg text-purple-600">{formatAmount(t.amount)}</p>
                                    <p className="text-xs text-muted-foreground">{formatDate(t.date)}</p>
                                </div>
                            </div>
                        </div>
                        {expandedTransactionId === t.id && (
                        <div className="bg-muted/50 border-t transition-all">
                            <div className="px-4 py-2 flex justify-end gap-2">
                                <Button variant="ghost" size="sm" onClick={() => setTransactionToEdit(t)}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit
                                </Button>
                                <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => setTransactionToDelete(t)}>
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete
                                </Button>
                            </div>
                        </div>
                        )}
                    </Card>
                )
              }

              return (
                <Card
                    key={t.id}
                    className={cn(
                    'transition-all duration-200 border-l-4 overflow-hidden',
                    isIncome ? 'border-l-green-500' : 'border-l-red-500',
                    expandedTransactionId === t.id ? 'bg-muted/50' : 'hover:bg-muted/50'
                    )}
                >
                    <div className='p-4 relative cursor-pointer' onClick={() => handleTransactionClick(t.id)}>
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex flex-1 items-center gap-4 truncate">
                        <div className={cn(
                            "p-2 rounded-full",
                            isIncome ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        )}>
                            {isIncome ? <ArrowDown className="h-5 w-5" /> : <ArrowUp className="h-5 w-5" />}
                        </div>
                        <div className="flex-1 truncate">
                            <p className="font-semibold truncate">{t.remarks || 'Transaction'}</p>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                {CategoryIcon ? (
                                    <>
                                        <CategoryIcon className="h-4 w-4" />
                                        <p className="truncate">{category?.name}</p>
                                    </>
                                ) : (
                                    <>
                                        {getAccountIcon(account?.name)}
                                        <p className="truncate">{account?.name || 'Unknown Account'}</p>
                                    </>
                                )}
                            </div>
                        </div>
                        </div>

                        <div className="text-right flex-shrink-0">
                        <p className={cn(
                            "font-bold text-lg",
                            isIncome ? 'text-green-600' : 'text-red-600'
                        )}>
                            {isIncome ? '+' : '-'} {formatAmount(t.amount)}
                        </p>
                        <p className="text-xs text-muted-foreground">{formatDate(t.date)}</p>
                        </div>
                    </div>
                    </div>
                    {expandedTransactionId === t.id && (
                    <div className="bg-muted/50 border-t transition-all">
                        <div className="px-4 py-2 flex justify-end gap-2">
                            <Button variant="ghost" size="sm" onClick={() => setTransactionToEdit(t)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                            </Button>
                            <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => setTransactionToDelete(t)}>
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                            </Button>
                        </div>
                    </div>
                    )}
                </Card>
              );
            })
          ) : (
            <div className="flex flex-col items-center justify-center text-center py-10 border-2 border-dashed rounded-lg">
              <div className="p-4 bg-secondary rounded-full mb-4">
                <BookText className="h-10 w-10 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2">No Transactions Found</h3>
              <p className="text-muted-foreground mb-4 max-w-sm">
                No transactions match your current filters. Try broadening your search.
              </p>
              <Button onClick={() => { setSearchTerm(''); setDateRange(undefined); setSelectedAccounts([]); setDateFilterLabel('All Time'); }}>
                Clear All Filters
              </Button>
            </div>
          )}
        </div>
      </div>
      
      {transactionToEdit && (
        <EditTransactionDialog
            key={transactionToEdit.id}
            transaction={transactionToEdit}
            open={!!transactionToEdit}
            onOpenChange={(isOpen) => !isOpen && setTransactionToEdit(null)}
        />
      )}
      
      <AlertDialog open={!!transactionToDelete} onOpenChange={(isOpen) => !isOpen && setTransactionToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this transaction.
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

export default function StatementPage() {
  return (
    <Suspense fallback={<Skeleton className="h-screen w-full" />}>
      <StatementPageContent />
    </Suspense>
  )
}

    