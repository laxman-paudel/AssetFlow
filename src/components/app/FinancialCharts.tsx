'use client';

import { useMemo, useState, useCallback } from 'react';
import { useAssetFlow } from '@/components/app/AppProvider';
import { getCategoryById } from '@/lib/categories';
import { subMonths, format, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
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
import { PieChart as PieChartIcon, BarChart3, Wallet } from 'lucide-react';

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
        <p className="text-[hsl(var(--primary))] font-medium flex items-center justify-between gap-4">
          <span>Income:</span>
          <span>{formatCurrency(payload[0].value)}</span>
        </p>
        <p className="text-[hsl(var(--destructive))] font-medium flex items-center justify-between gap-4">
          <span>Expense:</span>
          <span>{formatCurrency(payload[1].value)}</span>
        </p>
      </div>
    );
  }
  return null;
};

const renderActiveShape = (props: any) => {
  const RADIAN = Math.PI / 180;
  const { cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props;
  const sin = Math.sin(-RADIAN * midAngle);
  const cos = Math.cos(-RADIAN * midAngle);
  const sx = cx + (outerRadius + 10) * cos;
  const sy = cy + (outerRadius + 10) * sin;
  const mx = cx + (outerRadius + 30) * cos;
  const my = cy + (outerRadius + 30) * sin;
  const ex = mx + (cos >= 0 ? 1 : -1) * 22;
  const ey = my;
  const textAnchor = cos >= 0 ? 'start' : 'end';

  return (
    <g>
      <text x={cx} y={cy} dy={8} textAnchor="middle" fill={fill} className="font-semibold text-lg">
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

export default function FinancialCharts() {
  const { transactions, categories, currency, isInitialized, categoriesEnabled } = useAssetFlow();
  const [activeIndex, setActiveIndex] = useState(0);

  const onPieEnter = useCallback((_: any, index: number) => {
    setActiveIndex(index);
  }, [setActiveIndex]);

  const monthlySummaryData = useMemo(() => {
    if (!isInitialized || !transactions) return [];

    const data: { [key: string]: { income: number; expense: number } } = {};
    const sixMonthsAgo = subMonths(new Date(), 5);
    const chartStartDate = startOfMonth(sixMonthsAgo);

    for (let i = 5; i >= 0; i--) {
        const month = format(subMonths(new Date(), i), 'MMM yy');
        data[month] = { income: 0, expense: 0 };
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
      }));

  }, [transactions, isInitialized]);

  const spendingByCategoryData = useMemo(() => {
    if (!isInitialized || !transactions || !categoriesEnabled) return [];

    const currentMonthInterval = {
      start: startOfMonth(new Date()),
      end: endOfMonth(new Date()),
    };

    const spending: { [key: string]: number } = {};

    transactions.forEach(t => {
      if (
        t.type === 'expenditure' &&
        t.category &&
        isWithinInterval(new Date(t.date), currentMonthInterval)
      ) {
        const category = getCategoryById(t.category, categories || []);
        const categoryName = category ? category.name : 'Uncategorized';
        spending[categoryName] = (spending[categoryName] || 0) + t.amount;
      }
    });

    return Object.keys(spending).map(name => ({
      name,
      value: spending[name],
    })).sort((a, b) => b.value - a.value);
  }, [transactions, categories, isInitialized, categoriesEnabled]);

  const formatAxisValue = (value: number) => {
    if (value >= 1000) {
      return `${value / 1000}K`;
    }
    return value.toString();
  };
  
  const formatCurrencyForTooltip = (value: number) => {
    if (!currency) return value.toString();
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(value);
  }
  
  if (!isInitialized) {
      return (
          <div className="grid gap-6 md:grid-cols-2">
            <Skeleton className="h-96 w-full" />
            <Skeleton className="h-96 w-full" />
          </div>
      )
  }

  if (transactions?.length === 0) {
      return (
        <Card className="text-center py-20 col-span-1 md:col-span-2">
            <CardContent className="flex flex-col items-center justify-center">
                <Wallet className="h-16 w-16 text-muted-foreground mb-4"/>
                <h3 className="text-xl font-semibold mb-2">No Transaction Data</h3>
                <p className="text-muted-foreground max-w-sm">Your financial charts will appear here once you start recording your income and expenses.</p>
            </CardContent>
        </Card>
      )
  }

  return (
    <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-5">
      <Card className="lg:col-span-3">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-6 w-6" />
            Monthly Summary
          </CardTitle>
          <CardDescription>Income vs. Expense for the last 6 months.</CardDescription>
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
              />
              <Tooltip content={<CustomBarTooltip currency={currency} />} cursor={{ fill: 'hsl(var(--muted))' }} />
              <Legend iconSize={10} wrapperStyle={{fontSize: "0.8rem", paddingTop: '20px'}}/>
              <Bar dataKey="income" fill="url(#colorIncome)" name="Income" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expense" fill="url(#colorExpense)" name="Expense" radius={[4, 4, 0, 0]} />
            </BarChart>
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
                    <Tooltip formatter={formatCurrencyForTooltip} />
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
    </div>
  );
}
