'use client';

import FinancialCharts from '@/components/app/FinancialCharts';

export default function InsightsPage() {
  return (
    <div className="container mx-auto p-4 sm:p-6">
       <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Financial Insights</h1>
        <p className="text-muted-foreground">A visual overview of your financial health.</p>
      </div>
      <FinancialCharts />
    </div>
  );
}
