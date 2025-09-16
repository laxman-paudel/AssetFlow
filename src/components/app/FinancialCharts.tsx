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
  LineChart,
  Line,
  CartesianGrid,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '../ui/skeleton';
import { PieChart as PieChartIcon, BarChart3, Wallet, TrendingUp, TrendingDown, ArrowRight, ArrowLeftRight, LineChart as LineChartIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '../ui/badge';

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

const KeyMetricCard = ({ title, value, change, description, currency, icon: Icon, colorClass }: any) => (
    <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            {Icon && <Icon className={`h-5 w-5 ${colorClass ?? 'text-muted-foreground'}`} />}
        </CardHeader>
        <CardContent>
            <div className="text-2xl font-bold">
                {new Intl.NumberFormat('en-US', { style: 'currency', currency: currency || 'USD' }).format(value)}
            </div>
            <div className="flex items-center text-xs text-muted-foreground gap-1">
                {typeof change === 'number' && (
                    <Badge variant={change >= 0 ? 'default' : 'destructive'} className='flex gap-1 items-center'>
                        {change >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                        {change.toFixed(1)}%
                    </Badge>
                )}
                <span>{description}</span>
            </div>
        </CardContent>
    </Card>
)

export default function FinancialCharts() {
  const { transactions, categories, currency, isInitialized, categoriesEnabled, accounts } = useAssetFlow();
  const [activeIndex, setActiveIndex] = useState(0);

  const onPieEnter = useCallback((_: any, index: number) => {
    setActiveIndex(index);
  }, [setActiveIndex]);

  const financialData = useMemo(() => {
    if (!isInitialized || !transactions) return null;

    const data: { [key: string]: { income: number; expense: number, net: number } } = {};
    const sixMonthsAgo = subMonths(new Date(), 5);
    const chartStartDate = startOfMonth(sixMonthsAgo);

    for (let i = 5; i >= 0; i--) {
        const month = format(subMonths(new Date(), i), 'MMM yy');
        data[month] = { income: 0, expense: 0, net: 0 };
    }

    transactions.forEach(t => {
      const transactionDate = new Date(t.date);
      if (transactionDate < chartStartDate) return;
      
      const month = format(transactionDate, 'MMM yy');

      if(data[month]){
        if (t.type === 'income') {
            data[month].income += t.amount;
        } else if (t.type === 'expenditure') {
            data[month].expense += t.amount;
        }
      }
    });

    return Object.keys(data)
      .map(month => ({
        month,
        income: data[month].income,
        expense: data[month].expense,
        net: data[month].income - data[month].expense,
      }));
  }, [transactions, isInitialized]);

  const monthlySummaryData = financialData;

  const keyMetrics = useMemo(() => {
      if (!isInitialized || !transactions) return null;
      
      const currentMonthInterval = { start: startOfMonth(new Date()), end: endOfMonth(new Date()) };
      const lastMonthInterval = { start: startOfMonth(subMonths(new Date(), 1)), end: endOfMonth(subMonths(new Date(), 1)) };
      
      let currentMonthIncome = 0;
      let currentMonthExpense = 0;
      let lastMonthIncome = 0;
      let lastMonthExpense = 0;
      
      transactions.forEach(t => {
          const tDate = new Date(t.date);
          if (t.type === 'income' || t.type === 'expenditure') {
              if (isWithinInterval(tDate, currentMonthInterval)) {
                  if(t.type === 'income') currentMonthIncome += t.amount;
                  else currentMonthExpense += t.amount;
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
        
      const avgDailySpending = currentMonthExpense / getDaysInMonth(new Date());

      return { netIncome, currentMonthIncome, currentMonthExpense, avgDailySpending, netIncomeChange };
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
            lastSpending[categoryName] = (lastSpending[categoryName] || 0) + t.amount;
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
        : 100;
        
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
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-96 w-full lg:col-span-2" />
            <Skeleton className="h-96 w-full lg:col-span-2" />
          </div>
      )
  }

  if (transactions?.length === 0) {
      return (
        <Card className="text-center py-20 col-span-1 md:col-span-2 lg:col-span-4">
            <CardContent className="flex flex-col items-center justify-center">
                <Wallet className="h-16 w-16 text-muted-foreground mb-4"/>
                <h3 className="text-xl font-semibold mb-2">No Transaction Data</h3>
                <p className="text-muted-foreground max-w-sm">Your financial charts will appear here once you start recording your income and expenses.</p>
            </CardContent>
        </Card>
      )
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {keyMetrics && (
            <>
                <KeyMetricCard 
                    title="This Month's Net Income"
                    value={keyMetrics.netIncome}
                    change={keyMetrics.netIncomeChange}
                    description="from last month"
                    currency={currency}
                    icon={keyMetrics.netIncome >= 0 ? TrendingUp : TrendingDown}
                    colorClass={keyMetrics.netIncome >= 0 ? 'text-green-500' : 'text-red-500'}
                />
                 <KeyMetricCard 
                    title="Total Income"
                    value={keyMetrics.currentMonthIncome}
                    description={`this month`}
                    currency={currency}
                    icon={ArrowRight}
                    colorClass="text-green-500"
                />
                 <KeyMetricCard 
                    title="Total Expenses"
                    value={keyMetrics.currentMonthExpense}
                    description={`this month`}
                    currency={currency}
                    icon={ArrowLeftRight}
                    colorClass="text-red-500"
                />
                <KeyMetricCard 
                    title="Avg. Daily Spend"
                    value={keyMetrics.avgDailySpending}
                    description={`in ${format(new Date(), 'MMMM')}`}
                    currency={currency}
                    icon={PieChartIcon}
                />
            </>
        )}

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-6 w-6" />
            Income vs Expense
          </CardTitle>
          <CardDescription>Comparison for the last 6 months.</CardDescription>
        </CardHeader>
        <CardContent>
            <ResponsiveContainer width="100%" height={350}>
                <BarChart data={monthlySummaryData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
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
                    yAxisId="left"
                />
                <Tooltip content={<CustomBarTooltip currency={currency} />} cursor={{ fill: 'hsl(var(--muted))' }} />
                <Legend iconSize={10} wrapperStyle={{fontSize: "0.8rem", paddingTop: '20px'}}/>
                <Bar yAxisId="left" dataKey="income" fill="url(#colorIncome)" name="Income" radius={[4, 4, 0, 0]} />
                <Bar yAxisId="left" dataKey="expense" fill="url(#colorExpense)" name="Expense" radius={[4, 4, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
        </CardContent>
      </Card>
      
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LineChartIcon className="h-6 w-6" />
            Net Flow Trend
          </CardTitle>
          <CardDescription>Monthly net cash flow for the last 6 months.</CardDescription>
        </CardHeader>
        <CardContent>
            <ResponsiveContainer width="100%" height={350}>
                 <LineChart
                    data={monthlySummaryData}
                    margin={{ top: 5, right: 20, left: -10, bottom: 5, }}
                >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="month" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis 
                        fontSize={12} 
                        tickLine={false} 
                        axisLine={false} 
                        tickFormatter={formatAxisValue}
                        domain={['auto', 'auto']}
                    />
                    <Tooltip 
                        formatter={(value: number) => [formatCurrency(value), 'Net Flow']}
                        cursor={{ stroke: 'hsl(var(--primary))', strokeWidth: 1, strokeDasharray: '3 3' }}
                        contentStyle={{
                            background: "hsl(var(--background) / 0.9)",
                            backdropFilter: 'blur(4px)',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: 'var(--radius)'
                        }}
                    />
                    <Legend iconSize={10} wrapperStyle={{fontSize: "0.8rem", paddingTop: '20px'}}/>
                    <Line type="monotone" dataKey="net" name="Net Flow" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
            </ResponsiveContainer>
        </CardContent>
      </Card>
      
      {categoriesEnabled && (
        <Card className="lg:col-span-2">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                <PieChartIcon className="h-6 w-6" />
                This Month's Spending
                </CardTitle>
                <CardDescription>Breakdown of expenses for {format(new Date(), 'MMMM yyyy')}.</CardDescription>
            </CardHeader>
            <CardContent>
                {spendingByCategoryData.length > 0 ? (
                <ResponsiveContainer width="100%" height={350}>
                    <PieChart>
                    <Pie
                        activeIndex={activeIndex}
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
                ) : (
                <div className="h-[350px] flex flex-col items-center justify-center text-center text-muted-foreground p-4">
                    <PieChartIcon className="h-12 w-12 mb-4" />
                    <p className="font-semibold">No expenses recorded yet for this month.</p>
                    <p className="text-sm">Your spending breakdown will appear here once you add some expenses.</p>
                </div>
                )}
            </CardContent>
        </Card>
      )}

      <Card className="lg:col-span-2">
        <CardHeader>
            <CardTitle className="flex items-center gap-2">
            <Wallet className="h-6 w-6" />
            Account Balances
            </CardTitle>
            <CardDescription>Distribution of your assets across accounts.</CardDescription>
        </CardHeader>
        <CardContent>
             {accountBalanceData && accountBalanceData.length > 0 ? (
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
                                        {`${(percent * 100).toFixed(0)}%`}
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
             ) : (
                <div className="h-[350px] flex flex-col items-center justify-center text-center text-muted-foreground p-4">
                    <Wallet className="h-12 w-12 mb-4" />
                    <p className="font-semibold">No accounts with a positive balance.</p>
                    <p className="text-sm">This chart will show your asset distribution once you have funds.</p>
                </div>
             )}
        </CardContent>
      </Card>
    </div>
  );
}
