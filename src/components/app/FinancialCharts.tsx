'use client';

import { useMemo } from 'react';
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
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '../ui/skeleton';
import { PieChart as PieChartIcon, BarChart3, Wallet } from 'lucide-react';

// Define a consistent set of colors for the charts
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#ff4d4d', '#4ddbff', '#ffcce0'];


function CustomTooltip({ active, payload, label, currency }: any) {
  if (active && payload && payload.length) {
    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency || 'USD',
        }).format(value);
    }
    return (
      <div className="p-2 text-sm bg-background/80 backdrop-blur-sm rounded-lg border shadow-md">
        <p className="font-bold">{label}</p>
        <p className="text-green-600">{`Income: ${formatCurrency(payload[0].value)}`}</p>
        <p className="text-red-600">{`Expense: ${formatCurrency(payload[1].value)}`}</p>
      </div>
    );
  }
  return null;
};

export default function FinancialCharts() {
  const { transactions, categories, currency, isInitialized, categoriesEnabled } = useAssetFlow();

  const monthlySummaryData = useMemo(() => {
    if (!isInitialized || !transactions) return [];

    const data: { [key: string]: { income: number; expense: number } } = {};
    const sixMonthsAgo = subMonths(new Date(), 5);
    const chartStartDate = startOfMonth(sixMonthsAgo);

    // Initialize last 6 months
    for (let i = 0; i < 6; i++) {
        const month = format(subMonths(new Date(), i), 'MMM yyyy');
        data[month] = { income: 0, expense: 0 };
    }

    transactions.forEach(t => {
      const transactionDate = new Date(t.date);
      if (transactionDate < chartStartDate) return;
      
      const month = format(transactionDate, 'MMM yyyy');

      if (t.type === 'income') {
        data[month].income += t.amount;
      } else if (t.type === 'expenditure') {
        data[month].expense += t.amount;
      }
    });

    return Object.keys(data)
      .map(month => ({
        month,
        income: data[month].income,
        expense: data[month].expense,
      }))
      .reverse(); // To show oldest month first

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
    }));
  }, [transactions, categories, isInitialized, categoriesEnabled]);

  const formatAxisValue = (value: number) => {
    if (value >= 1000) {
      return `${value / 1000}K`;
    }
    return value;
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
          <div className="space-y-6">
            <Skeleton className="h-80 w-full" />
            <Skeleton className="h-80 w-full" />
          </div>
      )
  }

  if (transactions?.length === 0) {
      return (
        <Card className="text-center py-10">
            <CardContent className="flex flex-col items-center justify-center">
                <Wallet className="h-12 w-12 text-muted-foreground mb-4"/>
                <h3 className="text-xl font-semibold mb-2">No Transaction Data</h3>
                <p className="text-muted-foreground">Charts will appear here once you record some transactions.</p>
            </CardContent>
        </Card>
      )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-6 w-6" />
            Monthly Summary
          </CardTitle>
          <CardDescription>Income vs. Expense for the last 6 months.</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlySummaryData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
              <XAxis dataKey="month" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis 
                fontSize={12} 
                tickLine={false} 
                axisLine={false} 
                tickFormatter={formatAxisValue}
                domain={['auto', 'auto']}
              />
              <Tooltip content={<CustomTooltip currency={currency} />} cursor={{ fill: 'hsl(var(--muted))' }} />
              <Legend iconSize={10} wrapperStyle={{fontSize: "0.8rem", paddingTop: '20p'}}/>
              <Bar dataKey="income" fill="hsl(var(--primary))" name="Income" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expense" fill="hsl(var(--destructive))" name="Expense" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      
      {categoriesEnabled && (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                <PieChartIcon className="h-6 w-6" />
                This Month's Spending
                </CardTitle>
                <CardDescription>Breakdown of expenses by category for {format(new Date(), 'MMMM yyyy')}.</CardDescription>
            </CardHeader>
            <CardContent>
                {spendingByCategoryData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                    <Pie
                        data={spendingByCategoryData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        nameKey="name"
                        label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
                            const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                            const x = cx + radius * Math.cos(-midAngle * (Math.PI / 180));
                            const y = cy + radius * Math.sin(-midAngle * (Math.PI / 180));
                            return (percent > 0.05) ? (
                                <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={12}>
                                {`${(percent * 100).toFixed(0)}%`}
                                </text>
                            ) : null;
                        }}
                    >
                        {spendingByCategoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip formatter={formatCurrencyForTooltip} />
                    <Legend wrapperStyle={{fontSize: "0.8rem"}}/>
                    </PieChart>
                </ResponsiveContainer>
                ) : (
                <div className="h-[300px] flex flex-col items-center justify-center text-center text-muted-foreground">
                    <PieChartIcon className="h-10 w-10 mb-2" />
                    <p>No expenses recorded for this month.</p>
                </div>
                )}
            </CardContent>
        </Card>
      )}
    </div>
  );
}
