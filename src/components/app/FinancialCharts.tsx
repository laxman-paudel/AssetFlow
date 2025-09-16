'use client';

import { useMemo, useState, useCallback } from 'react';
import { useAssetFlow } from '@/components/app/AppProvider';
import { getCategoryById } from '@/lib/categories';
import { subMonths, format, startOfMonth, endOfMonth, isWithinInterval, getDaysInMonth } from 'date-fns';
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
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '../ui/skeleton';
import { PieChart as PieChartIcon, BarChart3, Wallet, TrendingUp, TrendingDown, ArrowRightLeft, ShoppingCart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '../ui/badge';
import type { Transaction } from '@/lib/types';


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
  const percent = payload.percent;
  const displayPercent = isFinite(percent) ? (percent * 100).toFixed(1) : '0.0';

  return (
    <g style={{ outline: 'none' }}>
      <text x={cx} y={cy} dy={-8} textAnchor="middle" fill={fill} className="font-semibold text-base truncate" width={innerRadius * 2}>
        {payload.name}
      </text>
      <text x={cx} y={cy} dy={12} textAnchor="middle" fill="hsl(var(--muted-foreground))" className="text-sm">
        {displayPercent}%
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
        innerRadius={outerRadius + 4}
        outerRadius={outerRadius + 8}
        fill={fill}
      />
    </g>
  );
};

const renderActive3DShape = (props: any) => {
  const RADIAN = Math.PI / 180;
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload } = props;
  const sin = Math.sin(-RADIAN * (startAngle + (endAngle - startAngle) / 2));
  const cos = Math.cos(-RADIAN * (startAngle + (endAngle - startAngle) / 2));
  const percent = payload.percent;
  const displayPercent = isFinite(percent) ? (percent * 100).toFixed(1) : '0.0';

  // This creates the 3D effect by stacking sectors
  const depth = 8;
  const sectors = Array.from({ length: depth }).map((_, i) => (
    <Sector
      key={i}
      cx={cx}
      cy={cy - i}
      innerRadius={innerRadius}
      outerRadius={outerRadius}
      startAngle={startAngle}
      endAngle={endAngle}
      fill={fill}
      stroke={fill}
      opacity={1 - (i * 0.1)}
    />
  ));
  
  return (
    <g style={{ outline: 'none' }}>
      {sectors}
      <text x={cx} y={cy - depth - 10} textAnchor="middle" fill={fill} className="font-semibold text-base truncate" width={innerRadius * 2}>
        {payload.name}
      </text>
      <text x={cx} y={cy - depth + 4} textAnchor="middle" fill="hsl(var(--muted-foreground))" className="text-sm">
        {displayPercent}%
      </text>
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
                    <span>{entry.value} ({total > 0 ? ((entry.payload.value / total) * 100).toFixed(0) : 0}%)</span>
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
  const [accountChartActiveIndex, setAccountChartActiveIndex] = useState(0);


  const onPieEnter = useCallback((_: any, index: number) => {
    setPieChartActiveIndex(index);
  }, [setPieChartActiveIndex]);

  const onAccountPieEnter = useCallback((_: any, index: number) => {
    setAccountChartActiveIndex(index);
  }, [setAccountChartActiveIndex]);

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
            lastSpending[name] = (lastSpending[name] || 0) + t.amount;
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
  
  const AccountTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      const total = accountBalanceData.reduce((sum, entry) => sum + entry.value, 0);
      const percent = total > 0 ? (data.value / total) * 100 : 0;
      return (
        <div className="p-2 text-sm bg-background/90 backdrop-blur-sm rounded-lg border shadow-lg">
          <p className="font-bold">{data.name}</p>
          <p>{formatCurrency(data.value)} ({isFinite(percent) ? percent.toFixed(1) : 0}%)</p>
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
      
      <div className="grid md:grid-cols-2 gap-6">
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
                        <PieChart className="outline-none">
                        <Pie
                            activeIndex={pieChartActiveIndex}
                            activeShape={renderActiveShape}
                            data={spendingByCategoryData}
                            cx="50%"
                            cy="50%"
                            innerRadius={70}
                            outerRadius={90}
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
                        <PieChart className="outline-none">
                             <Pie
                                activeIndex={accountChartActiveIndex}
                                activeShape={renderActive3DShape}
                                data={accountBalanceData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={100}
                                fill="hsl(var(--primary))"
                                dataKey="value"
                                nameKey="name"
                                onMouseEnter={onAccountPieEnter}
                                onMouseLeave={() => setAccountChartActiveIndex(0)}
                            >
                                {accountBalanceData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            {accountChartActiveIndex === 0 && (
                                <>
                                    <text
                                        x="50%"
                                        y="45%"
                                        textAnchor="middle"
                                        dominantBaseline="middle"
                                        className="text-sm fill-muted-foreground"
                                    >
                                        Total Balance
                                    </text>
                                    <text
                                        x="50%"
                                        y="55%"
                                        textAnchor="middle"
                                        dominantBaseline="middle"
                                        className="text-2xl font-bold fill-foreground"
                                    >
                                        {formatCurrency(totalBalance ?? 0)}
                                    </text>
                                </>
                            )}
                            <Tooltip content={<AccountTooltip />} />
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
