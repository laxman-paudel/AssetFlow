'use client';

import { useMemo } from 'react';
import { useAssetFlow } from '@/components/app/AppProvider';
import { subMonths, format, startOfMonth, endOfMonth, isWithinInterval, getDaysInMonth } from 'date-fns';
import {
  ResponsiveContainer,
  BarChart,
  XAxis,
  YAxis,
  Tooltip,
  Bar,
  Legend,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '../ui/skeleton';
import { PieChart as PieChartIcon, BarChart3, Wallet, TrendingUp, TrendingDown, ArrowRightLeft, ShoppingCart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '../ui/badge';
import type { Transaction } from '@/lib/types';


function CustomBarTooltip({ active, payload, label, currency }: any) {
  if (active && payload && payload.length) {
    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency || 'USD',
        }).format(value);
    }
    return (
      <div className="p-2 text-sm bg-background/90 backdrop-blur-sm rounded-lg border shadow-lg">
        <p className="font-bold mb-1">{label}</p>
        <p className="text-green-500 font-medium flex items-center justify-between gap-4">
          <span>Income:</span>
          <span>{formatCurrency(payload[0].value)}</span>
        </p>
        <p className="text-red-500 font-medium flex items-center justify-between gap-4">
          <span>Expense:</span>
          <span>{formatCurrency(payload[1].value)}</span>
        </p>
      </div>
    );
  }
  return null;
};

const KeyMetricCard = ({ title, value, change, description, currency, icon: Icon, colorClass, children }: any) => (
    <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            {Icon && <Icon className={cn('h-5 w-5', colorClass ?? 'text-muted-foreground')} />}
        </CardHeader>
        <CardContent>
            {children ? (
                children
            ) : (
                <>
                <div className="text-2xl font-bold">
                    {new Intl.NumberFormat('en-US', { style: 'currency', currency: currency || 'USD' }).format(value)}
                </div>
                <div className="flex items-center text-xs text-muted-foreground gap-1">
                    {typeof change === 'number' && isFinite(change) && (
                        <Badge variant={change >= 0 ? 'default' : 'destructive'} className='flex gap-1 items-center'>
                            {change >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                            {change.toFixed(1)}%
                        </Badge>
                    )}
                    <span>{description}</span>
                </div>
                </>
            )}
        </CardContent>
    </Card>
)

export default function FinancialCharts() {
  const { transactions, currency, isInitialized } = useAssetFlow();

  const financialData = useMemo(() => {
    if (!isInitialized || !transactions) return null;

    const monthlySummary: { [key: string]: { income: number; expense: number } } = {};
    const sixMonthsAgo = subMonths(new Date(), 5);
    const chartStartDate = startOfMonth(sixMonthsAgo);

    for (let i = 5; i >= 0; i--) {
      const month = format(subMonths(new Date(), i), 'MMM yy');
      monthlySummary[month] = { income: 0, expense: 0 };
    }

    transactions.forEach(t => {
      const transactionDate = new Date(t.date);
      if (transactionDate >= chartStartDate) {
        const month = format(transactionDate, 'MMM yy');
        if (monthlySummary[month]) {
          if (t.type === 'income') {
            monthlySummary[month].income += t.amount;
          } else if (t.type === 'expenditure') {
            monthlySummary[month].expense += t.amount;
          }
        }
      }
    });
    
    const monthlySummaryData = Object.keys(monthlySummary).map(month => ({
        month,
        income: monthlySummary[month].income,
        expense: monthlySummary[month].expense,
    }));

    return { monthlySummaryData };
  }, [transactions, isInitialized]);

  const keyMetrics = useMemo(() => {
      if (!isInitialized || !transactions) return null;
      
      const currentMonthInterval = { start: startOfMonth(new Date()), end: endOfMonth(new Date()) };
      const lastMonthInterval = { start: startOfMonth(subMonths(new Date(), 1)), end: endOfMonth(subMonths(new Date(), 1)) };
      
      let currentMonthIncome = 0;
      let currentMonthExpense = 0;
      let lastMonthIncome = 0;
      let lastMonthExpense = 0;
      let biggestExpense: Transaction | null = null;
      
      transactions.forEach(t => {
          const tDate = new Date(t.date);
          if (t.type === 'income' || t.type === 'expenditure') {
              if (isWithinInterval(tDate, currentMonthInterval)) {
                  if(t.type === 'income') currentMonthIncome += t.amount;
                  else {
                      currentMonthExpense += t.amount;
                      if (!biggestExpense || t.amount > biggestExpense.amount) {
                          biggestExpense = t;
                      }
                  }
              } else if (isWithinInterval(tDate, lastMonthInterval)) {
                  if(t.type === 'income') lastMonthIncome += t.amount;
                  else lastMonthExpense += t.amount;
              }
          }
      });
      
      const netIncome = currentMonthIncome - currentMonthExpense;
      const lastMonthNetIncome = lastMonthIncome - lastMonthExpense;
      
      const netIncomeChange = lastMonthNetIncome !== 0
        ? ((netIncome - lastMonthNetIncome) / Math.abs(lastMonthNetIncome)) * 100
        : netIncome > 0 ? 100 : 0;
        
      const avgDailySpending = currentMonthExpense > 0 ? currentMonthExpense / getDaysInMonth(new Date()) : 0;


      return { netIncome, currentMonthIncome, currentMonthExpense, avgDailySpending, netIncomeChange, biggestExpense };
  }, [transactions, isInitialized]);

  const formatAxisValue = (value: number) => {
    if (Math.abs(value) >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    }
    if (Math.abs(value) >= 1000) {
      return `${value / 1000}K`;
    }
    return value.toString();
  };
  
  const formatCurrency = (value: number) => {
    if (!currency) return value.toString();
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(value);
  }
  
  if (!isInitialized) {
      return (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-96 w-full lg:col-span-3" />
          </div>
      )
  }

  if (!transactions || transactions.length === 0) {
      return (
        <Card className="text-center py-20 col-span-1 md:col-span-2 lg:col-span-3">
            <CardContent className="flex flex-col items-center justify-center">
                <Wallet className="h-16 w-16 text-muted-foreground mb-4"/>
                <h3 className="text-xl font-semibold mb-2">No Transaction Data</h3>
                <p className="text-muted-foreground max-w-sm">Your financial charts will appear here once you start recording your income and expenses.</p>
            </CardContent>
        </Card>
      )
  }

  return (
    <div className="grid gap-6 auto-rows-auto">
        {keyMetrics && (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <KeyMetricCard 
                    title="This Month's Net Income"
                    value={keyMetrics.netIncome}
                    change={keyMetrics.netIncomeChange}
                    description="vs. last month"
                    currency={currency}
                    icon={ArrowRightLeft}
                    colorClass={keyMetrics.netIncome >= 0 ? 'text-green-500' : 'text-red-500'}
                />
                <KeyMetricCard 
                    title="Avg. Daily Spend"
                    value={keyMetrics.avgDailySpending}
                    description={`in ${format(new Date(), 'MMMM')}`}
                    currency={currency}
                    icon={PieChartIcon}
                    colorClass="text-blue-500"
                />
                <KeyMetricCard
                    title="Biggest Expense"
                    icon={ShoppingCart}
                    colorClass="text-orange-500"
                    currency={currency}
                >
                    {keyMetrics.biggestExpense ? (
                        <div>
                            <div className="text-2xl font-bold">
                               {formatCurrency(keyMetrics.biggestExpense.amount)}
                            </div>
                            <p className="text-xs text-muted-foreground truncate">
                                {keyMetrics.biggestExpense.remarks || 'Unspecified Expense'}
                            </p>
                        </div>
                    ) : (
                        <div>
                            <div className="text-2xl font-bold">
                                {formatCurrency(0)}
                            </div>
                            <p className="text-xs text-muted-foreground">No expenses yet this month.</p>
                        </div>
                    )}
                </KeyMetricCard>
            </div>
        )}
        
      <Card className="col-span-1 lg:col-span-3">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-6 w-6" />
            Income vs Expense
          </CardTitle>
          <CardDescription>A summary of your cash flow for the last 6 months.</CardDescription>
        </CardHeader>
        <CardContent>
            <ResponsiveContainer width="100%" height={350}>
                <BarChart data={financialData?.monthlySummaryData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                    <defs>
                        <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.2}/>
                        </linearGradient>
                        <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(var(--destructive))" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="hsl(var(--destructive))" stopOpacity={0.2}/>
                        </linearGradient>
                    </defs>
                <XAxis dataKey="month" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false} 
                    tickFormatter={formatAxisValue}
                />
                <Tooltip content={<CustomBarTooltip currency={currency} />} cursor={{ fill: 'hsl(var(--muted))' }} />
                <Legend iconSize={10} wrapperStyle={{fontSize: "0.8rem", paddingTop: '20px'}}/>
                <Bar dataKey="income" fill="url(#colorIncome)" name="Income" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expense" fill="url(#colorExpense)" name="Expense" radius={[4, 4, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
