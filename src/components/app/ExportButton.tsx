'use client';

import { useAssetFlow } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function ExportButton({ minimal = false }: { minimal?: boolean }) {
  const { transactions } = useAssetFlow();
  const { toast } = useToast();

  const handleExport = () => {
    if (transactions.length === 0) {
      toast({
        title: 'No Data to Export',
        description: 'There are no transactions to export.',
      });
      return;
    }

    const header = ['ID', 'Date', 'Type', 'Amount', 'Asset ID', 'Asset Name', 'Remarks'];
    const rows = transactions.map(t => 
      [
        t.id,
        new Date(t.date).toLocaleString(),
        t.type,
        t.amount,
        t.assetId,
        `"${t.assetName.replace(/"/g, '""')}"`,
        `"${t.remarks.replace(/"/g, '""')}"`
      ].join(',')
    );

    const csvContent = [header.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `assetflow_transactions_${new Date().toISOString()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
        title: 'Export Successful',
        description: 'Your transaction data has been downloaded as a CSV file.',
    });
  };

  if (minimal) {
    return (
      <Button onClick={handleExport} variant="outline" size="icon">
        <Download className="h-4 w-4" />
      </Button>
    )
  }

  return (
    <Button onClick={handleExport} variant="outline">
      <Download className="mr-2 h-4 w-4" />
      Export Transactions
    </Button>
  );
}
