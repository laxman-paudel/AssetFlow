'use client';

import { useAssetFlow } from '@/components/app/AppProvider';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { format } from 'date-fns';

export default function ExportButton() {
  const { transactions, accounts } = useAssetFlow();
  const { toast } = useToast();

  const handleExport = () => {
    if (!transactions || transactions.length === 0) {
      toast({
        title: 'No Data to Export',
        description: 'There are no transactions to export.',
      });
      return;
    }
    
    const accountIdSet = new Set(accounts?.map(a => a.id));

    const header = ['Date', 'Time', 'Type', 'Amount', 'Account', 'Remarks', 'Is Orphaned'];
    const rows = transactions.map(t => {
      try {
        const date = new Date(t.date);
        const rowDate = format(date, 'yyyy-MM-dd');
        const rowTime = format(date, 'HH:mm:ss');
        
        let amount = t.amount;
        if (t.type === 'expenditure') {
            amount = -amount;
        }
        
        const remarks = `"${(t.remarks || '').replace(/"/g, '""')}"`;
        const accountName = `"${(t.accountName || '').replace(/"/g, '""')}"`;
        const isOrphaned = t.type !== 'account_creation' && !accountIdSet.has(t.accountId);

        return [
          rowDate,
          rowTime,
          t.type,
          amount,
          accountName,
          remarks,
          isOrphaned
        ].join(',');
      } catch (e) {
        console.warn('Skipping invalid transaction record for export:', t, e);
        return '';
      }
    }).filter(row => row !== '');

    if (rows.length === 0) {
      toast({
        title: 'No Data to Export',
        description: 'All transaction records seem to be invalid.',
      });
      return;
    }

    const csvContent = [header.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `assetflow_transactions_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
        title: 'Export Successful',
        description: 'Your transaction data has been downloaded as a CSV file.',
    });
  };

  return (
    <Button onClick={handleExport} variant="outline">
      <Download className="mr-2 h-4 w-4" />
      Export All Transactions
    </Button>
  );
}
