'use client';

import { useAssetFlow } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Transaction } from '@/lib/types';
import { format } from 'date-fns';

interface ExportButtonProps {
  minimal?: boolean;
  transactions?: Transaction[];
}

export default function ExportButton({ minimal = false, transactions: transactionsToExport }: ExportButtonProps) {
  const { transactions: allTransactions } = useAssetFlow();
  const { toast } = useToast();

  const handleExport = () => {
    const dataToExport = transactionsToExport ?? allTransactions;

    if (!dataToExport || dataToExport.length === 0) {
      toast({
        title: 'No Data to Export',
        description: 'There are no transactions to export.',
      });
      return;
    }

    const header = ['Date', 'Time', 'Type', 'Amount', 'Account', 'Remarks'];
    const rows = dataToExport.map(t => {
      const date = new Date(t.date);
      const rowDate = format(date, 'yyyy-MM-dd');
      const rowTime = format(date, 'HH:mm:ss');
      let amount = t.amount;
      if (t.type === 'expenditure') {
          amount = -amount;
      }
      
      return [
        rowDate,
        rowTime,
        t.type,
        amount,
        `"${t.accountName.replace(/"/g, '""')}"`,
        `"${(t.remarks || '').replace(/"/g, '""')}"`
      ].join(',');
    });

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
      Export All Transactions
    </Button>
  );
}
