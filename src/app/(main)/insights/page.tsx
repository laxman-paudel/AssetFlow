import InsightsGenerator from '@/components/app/InsightsGenerator';

export default function InsightsPage() {
  return (
    <div className="container mx-auto p-4 sm:p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">AI Insights</h1>
      </div>
      <p className="text-muted-foreground mb-6">
        Get personalized insights into your spending patterns and discover savings opportunities with our AI-powered analysis.
      </p>
      <InsightsGenerator />
    </div>
  );
}
