'use client';

import { useState } from 'react';
import { useAssetFlow } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getSpendingInsights, SpendingInsightsInput } from '@/ai/flows/spending-insights';
import { Skeleton } from '@/components/ui/skeleton';
import { Sparkles } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';

export default function InsightsGenerator() {
  const { transactions, assets, isInitialized } = useAssetFlow();
  const [loading, setLoading] = useState(false);
  const [insights, setInsights] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateInsights = async () => {
    setLoading(true);
    setInsights(null);
    setError(null);

    const transactionsForAI: SpendingInsightsInput['transactions'] = transactions.map(t => {
      const asset = assets.find(a => a.id === t.assetId);
      const date = new Date(t.date);
      return {
        date: date.toISOString().split('T')[0],
        time: date.toTimeString().split(' ')[0].substring(0, 5),
        asset: asset?.name || 'Unknown Asset',
        amount: t.amount,
        remarks: t.remarks,
        type: t.type,
      };
    });

    try {
      const result = await getSpendingInsights({ transactions: transactionsForAI });
      setInsights(result.insights);
    } catch (e) {
        console.error(e);
        setError('Failed to generate insights. Please try again later.');
    } finally {
        setLoading(false);
    }
  };

  if (!isInitialized) {
    return <Skeleton className="h-48 w-full" />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Spending Analysis</CardTitle>
        <CardDescription>
          Click the button to analyze your recent transactions.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {transactions.length < 3 && (
            <Alert>
                <AlertTitle>Not Enough Data</AlertTitle>
                <AlertDescription>
                    You need at least 3 transactions to generate meaningful insights.
                </AlertDescription>
            </Alert>
        )}
        <Button onClick={handleGenerateInsights} disabled={loading || transactions.length < 3}>
          {loading ? 'Analyzing...' : 'Generate Insights'}
          <Sparkles className="ml-2 h-4 w-4" />
        </Button>

        {loading && (
          <div className="space-y-2 pt-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        )}

        {error && (
            <Alert variant="destructive" className="mt-4">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        )}

        {insights && (
          <div className="pt-4">
            <h3 className="font-semibold mb-2">Your Financial Insights:</h3>
            <div className="prose prose-sm max-w-none text-sm text-foreground bg-muted p-4 rounded-md">
                {insights.split('\n').map((line, i) => (
                    <p key={i}>{line}</p>
                ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
