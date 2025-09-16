'use client';

import { useMemo, useState, useCallback, useRef } from 'react';
import { useAssetFlow } from '@/components/app/AppProvider';
import { getCategoryById } from '@/lib/categories';
import { subMonths, format, startOfMonth, endOfMonth, isWithinInterval, getDaysInMonth, eachDayOfInterval, lastDayOfMonth, parseISO, startOfDay, subDays } from 'date-fns';
import {
  ResponsiveContainer,
  BarChart,
  XAxis,
  YAxis,
  Tooltip,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
  Sector,
  LineChart,
  Line,
  AreaChart,
  Area,
  ReferenceLine,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '../ui/skeleton';
import { PieChart as PieChartIcon, BarChart3, Wallet, TrendingUp, TrendingDown, ArrowRightLeft, ShoppingCart, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '../ui/badge';
import type { Transaction } from '@/lib/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"


const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#ff4d4d', '#4ddbff', '#ffcce0'];

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

const renderActiveShape = (props: any) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload } = props;

  return (
    <g>
      <text x={cx} y={cy} dy={8} textAnchor="middle" fill={fill} className="font-semibold text-lg truncate" width={innerRadius * 2}>
        {payload.name}
      </text>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
      <Sector
        cx={cx}
        cy={cy}
        startAngle={startAngle}
        endAngle={endAngle}
        innerRadius={outerRadius + 6}
        outerRadius={outerRadius + 10}
        fill={fill}
      />
    </g>
  );
};

const renderCustomizedLegend = (props: any) => {
    const { payload } = props;
    if (!payload || payload.length === 0) return null;
    
    const total = payload.reduce((sum: number, entry: any) => sum + entry.payload.value, 0);

    return (
        <ul className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-muted-foreground mt-4">
            {payload.map((entry: any, index: number) => (
                <li key={`item-${index}`} className="flex items-center gap-2">
                    <span style={{ backgroundColor: entry.color, width: '10px', height: '10px', borderRadius: '50%', display: 'inline-block' }}></span>
                    <span>{entry.value} ({((entry.payload.value / total) * 100).toFixed(0)}%)</span>
                </li>
            ))}
        </ul>
    );
}

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
  const { transactions, categories, currency, isInitialized, categoriesEnabled, accounts, totalBalance } = useAssetFlow();
  const [pieChartActiveIndex, setPieChartActiveIndex] = useState(0);
  const [balanceHistoryScale, setBalanceHistoryScale] = useState<'monthly' | 'daily'>('monthly');

  const onPieEnter = useCallback((_: any, index: number) => {
    setPieChartActiveIndex(index);
  }, [setPieChartActiveIndex]);

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

  const balanceHistoryData = useMemo(() => {
    if (!isInitialized || !transactions || totalBalance === null) return [];
    
    const sortedTransactions = [...transactions].sort((a, b) => parseISO(a.date).getTime() - parseISO(b.date).getTime());

    if (balanceHistoryScale === 'monthly') {
        const totalChange = sortedTransactions.reduce((acc, t) => {
            switch (t.type) {
                case 'income': return acc + t.amount;
                case 'expenditure': return acc - t.amount;
                case 'account_creation': return acc + t.amount;
                default: return acc;
            }
        }, 0);
        const startingBalance = totalBalance - totalChange;
        
        const history: { [key: string]: number } = {};
        let currentBalance = startingBalance;
        
        sortedTransactions.forEach(t => {
            const monthKey = format(parseISO(t.date), 'yyyy-MM');
            if (t.type === 'income') currentBalance += t.amount;
            else if (t.type === 'expenditure') currentBalance -= t.amount;
            else if (t.type === 'account_creation') currentBalance += t.amount;
            history[monthKey] = currentBalance;
        });

        return Object.entries(history).map(([date, balance]) => ({
            date: format(parseISO(`${date}-01`), 'MMM yy'),
            balance,
        }));
    } else { // daily
        const today = startOfDay(new Date());
        const thirtyDaysAgo = subDays(today, 30);
        
        const changeBefore30Days = sortedTransactions
            .filter(t => parseISO(t.date) < thirtyDaysAgo)
            .reduce((acc, t) => {
                switch (t.type) {
                    case 'income': return acc + t.amount;
                    case 'expenditure': return acc - t.amount;
                    case 'account_creation': return acc + t.amount;
                    default: return acc;
                }
            }, 0);

        const totalChange = sortedTransactions.reduce((acc, t) => {
            switch (t.type) {
                case 'income': return acc + t.amount;
                case 'expenditure': return acc - t.amount;
                case 'account_creation': return acc + t.amount;
                default: return acc;
            }
        }, 0);

        const initialBalance = totalBalance - totalChange;
        let startingBalanceForPeriod = initialBalance + changeBefore30Days;
        
        const transactionsInLast30Days = sortedTransactions.filter(t => parseISO(t.date) >= thirtyDaysAgo);
        
        const datePoints: { [key: string]: number } = {};

        let currentBalance = startingBalanceForPeriod;
        let transactionIndex = 0;
        
        const days = eachDayOfInterval({start: thirtyDaysAgo, end: today});
        if (days.length === 0 && transactionsInLast30Days.length === 0) return [];
        if (days.length === 0 && transactionsInLast30Days.length > 0) {
           days.push(today);
        }

        for (const day of days) {
            const dayKey = format(day, 'yyyy-MM-dd');
            while(transactionIndex < transactionsInLast30Days.length && startOfDay(parseISO(transactionsInLast30Days[transactionIndex].date)).getTime() === day.getTime()) {
                const t = transactionsInLast30Days[transactionIndex];
                 if (t.type === 'income') currentBalance += t.amount;
                 else if (t.type === 'expenditure') currentBalance -= t.amount;
                 else if (t.type === 'account_creation') currentBalance += t.amount;
                 transactionIndex++;
            }
            datePoints[dayKey] = currentBalance;
        }

        return Object.entries(datePoints).map(([date, balance]) => ({
            date: format(parseISO(date), 'MMM d'),
            balance
        }));
    }

  }, [transactions, isInitialized, totalBalance, balanceHistoryScale]);

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

  const spendingByCategoryData = useMemo(() => {
    if (!isInitialized || !transactions || !categoriesEnabled) return [];

    const currentMonthInterval = { start: startOfMonth(new Date()), end: endOfMonth(new Date()) };
    const lastMonthInterval = { start: startOfMonth(subMonths(new Date(), 1)), end: endOfMonth(subMonths(new Date(), 1)) };

    const currentSpending: { [key: string]: number } = {};
    const lastSpending: { [key: string]: number } = {};

    transactions.forEach(t => {
      if (t.type === 'expenditure' && t.category) {
        const category = getCategoryById(t.category, categories || []);
        const categoryName = category ? category.name : 'Uncategorized';
        
        if (isWithinInterval(new Date(t.date), currentMonthInterval)) {
            currentSpending[categoryName] = (currentSpending[categoryName] || 0) + t.amount;
        } else if (isWithinInterval(new Date(t.date), lastMonthInterval)) {
            lastSpending[categoryName] = (lastSpending[name] || 0) + t.amount;
        }
      }
    });

    return Object.keys(currentSpending).map(name => ({
      name,
      value: currentSpending[name],
      lastMonthValue: lastSpending[name] || 0,
    })).sort((a, b) => b.value - a.value);
  }, [transactions, categories, isInitialized, categoriesEnabled]);

  const accountBalanceData = useMemo(() => {
      if (!isInitialized || !accounts) return [];
      return accounts.map(acc => ({ name: acc.name, value: acc.balance })).filter(acc => acc.value > 0);
  }, [accounts, isInitialized]);

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
  
  const LineChartTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="p-2 text-sm bg-background/90 backdrop-blur-sm rounded-lg border shadow-lg">
          <p className="font-bold mb-1">{label}</p>
          <p className="font-medium">
            Balance: <span className="font-bold">{formatCurrency(payload[0].value)}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  const CategoryTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const change = data.lastMonthValue !== 0 
        ? ((data.value - data.lastMonthValue) / data.lastMonthValue) * 100
        : data.value > 0 ? 100 : 0;
        
      return (
        <div className="p-2 text-sm bg-background/90 backdrop-blur-sm rounded-lg border shadow-lg">
          <p className="font-bold mb-1">{data.name}: {formatCurrency(data.value)}</p>
          <div className="flex items-center text-xs text-muted-foreground gap-1">
                {isFinite(change) && (
                    <Badge variant={change >= 0 ? 'destructive' : 'default'} className='flex gap-1 items-center'>
                        {change >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                        {change.toFixed(1)}%
                    </Badge>
                )}
                <span>vs last month</span>
            </div>
        </div>
      );
    }
    return null;
  };
  
  if (!isInitialized) {
      return (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-96 w-full lg:col-span-3" />
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
        
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-6 w-6" />
            Balance History
          </CardTitle>
          <CardDescription>The historical progression of your total balance over time.</CardDescription>
        </CardHeader>
        <CardContent className='pl-2 pr-6'>
          <Tabs value={balanceHistoryScale} onValueChange={(value) => setBalanceHistoryScale(value as any)} className="w-full">
            <div className="flex justify-end">
              <TabsList>
                <TabsTrigger value="monthly">Monthly</TabsTrigger>
                <TabsTrigger value="daily">Last 30 Days</TabsTrigger>
              </TabsList>
            </div>
            <TabsContent value="monthly" className="mt-4">
              <ResponsiveContainer width="100%" height={350}>
                {balanceHistoryData.length > 0 ? (
                  <AreaChart data={balanceHistoryData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                    <defs>
                      <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="date" fontSize={12} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                    <YAxis 
                      fontSize={12} 
                      tickLine={false} 
                      axisLine={false} 
                      tickFormatter={formatAxisValue}
                      domain={['dataMin - 1000', 'dataMax + 1000']}
                    />
                    <Tooltip content={<LineChartTooltip />} cursor={{ stroke: 'hsl(var(--primary))', strokeWidth: 1, strokeDasharray: '3 3' }} />
                    <Area type="monotone" dataKey="balance" stroke="hsl(var(--primary))" fill="url(#colorBalance)" strokeWidth={2} />
                  </AreaChart>
                ) : <p className="text-center text-muted-foreground pt-10">Not enough data for a monthly view.</p>}
              </ResponsiveContainer>
            </TabsContent>
            <TabsContent value="daily" className="mt-4">
               <ResponsiveContainer width="100%" height={350}>
                {balanceHistoryData.length > 1 ? (
                  <AreaChart data={balanceHistoryData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                     <defs>
                      <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="date" fontSize={12} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                    <YAxis 
                      fontSize={12} 
                      tickLine={false} 
                      axisLine={false} 
                      tickFormatter={formatAxisValue}
                      domain={['dataMin - 1000', 'dataMax + 1000']}
                    />
                    <Tooltip content={<LineChartTooltip />} cursor={{ stroke: 'hsl(var(--primary))', strokeWidth: 1, strokeDasharray: '3 3' }} />
                    <Area type="monotone" dataKey="balance" stroke="hsl(var(--primary))" fill="url(#colorBalance)" strokeWidth={2} />
                  </AreaChart>
                 ) : <p className="text-center text-muted-foreground pt-10">Not enough data for a daily view.</p>}
              </ResponsiveContainer>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
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
                        domain={['auto', 'auto']}
                    />
                    <Tooltip content={<CustomBarTooltip currency={currency} />} cursor={{ fill: 'hsl(var(--muted))' }} />
                    <Legend iconSize={10} wrapperStyle={{fontSize: "0.8rem", paddingTop: '20px'}}/>
                    <Bar dataKey="income" fill="url(#colorIncome)" name="Income" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="expense" fill="url(#colorExpense)" name="Expense" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
        
        {categoriesEnabled && spendingByCategoryData.length > 0 && (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                    <PieChartIcon className="h-6 w-6" />
                    This Month's Spending
                    </CardTitle>
                    <CardDescription>Breakdown of expenses for {format(new Date(), 'MMMM yyyy')}.</CardDescription>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={350}>
                        <PieChart>
                        <Pie
                            activeIndex={pieChartActiveIndex}
                            activeShape={renderActiveShape}
                            data={spendingByCategoryData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            fill="hsl(var(--primary))"
                            dataKey="value"
                            nameKey="name"
                            onMouseEnter={onPieEnter}
                        >
                            {spendingByCategoryData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip content={<CategoryTooltip />} />
                        <Legend content={renderCustomizedLegend} />
                        </PieChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        )}

        {accountBalanceData && accountBalanceData.length > 0 && (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                    <Wallet className="h-6 w-6" />
                    Account Balances
                    </CardTitle>
                    <CardDescription>Distribution of your assets across accounts.</CardDescription>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={350}>
                        <PieChart>
                            <Pie
                                data={accountBalanceData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }) => {
                                    const RADIAN = Math.PI / 180;
                                    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                                    const x = cx + radius * Math.cos(-midAngle * RADIAN);
                                    const y = cy + radius * Math.sin(-midAngle * RADIAN);
                                    return ( (percent * 100) > 5 ? 
                                        <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central">
                                            {` ${(percent * 100).toFixed(0)}%`}
                                        </text> : null
                                    );
                                }}
                                outerRadius={100}
                                fill="hsl(var(--primary))"
                                dataKey="value"
                                nameKey="name"
                            >
                                {accountBalanceData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip formatter={formatCurrency} />
                            <Legend iconSize={10} wrapperStyle={{fontSize: "0.8rem", paddingTop: '20px'}} />
                        </PieChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        )}
      </div>

       {/* Fallback for empty states */}
        {categoriesEnabled && spendingByCategoryData.length === 0 && (
            <Card>
                <CardHeader>
                    <CardTitle>This Month's Spending</CardTitle>
                </CardHeader>
                <CardContent className="h-[350px] flex flex-col items-center justify-center text-center text-muted-foreground p-4">
                    <PieChartIcon className="h-12 w-12 mb-4" />
                    <p className="font-semibold">No expenses recorded yet for this month.</p>
                    <p className="text-sm">Your spending breakdown will appear here once you add some expenses.</p>
                </CardContent>
            </Card>
        )}
        
        {(!accountBalanceData || accountBalanceData.length === 0) && (
            <Card>
                <CardHeader>
                    <CardTitle>Account Balances</CardTitle>
                </CardHeader>
                <CardContent className="h-[350px] flex flex-col items-center justify-center text-center text-muted-foreground p-4">
                     <Wallet className="h-12 w-12 mb-4" />
                    <p className="font-semibold">No accounts with a positive balance.</p>
                    <p className="text-sm">This chart will show your asset distribution once you have funds.</p>
                </CardContent>
            </Card>
        )}
    </div>
  );
}
