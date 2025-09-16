'use client';

import FinancialCharts from '@/components/app/FinancialCharts';

export default function InsightsPage() {
  return (
    <div className="container mx-auto p-4 sm:p-6">
       <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Financial Insights</h1>
      </div>
      <FinancialCharts />
    </div>
  );
}
