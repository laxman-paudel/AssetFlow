'use client';

import { useAssetFlow } from '@/components/app/AppProvider';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { format } from 'date-fns';
import { Transaction } from '@/lib/types';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface StatementExportButtonProps {
    transactions: Transaction[];
}

export default function StatementExportButton({ transactions }: StatementExportButtonProps) {
  const { toast } = useToast();

  const handleExport = () => {
    if (!transactions || transactions.length === 0) {
      toast({
        title: 'No Data to Export',
        description: 'There are no transactions in the current view to export.',
      });
      return;
    }
    
    const header = ['Date', 'Time', 'Type', 'Amount', 'Account', 'To Account', 'Category', 'Remarks'];
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
        const toAccountName = `"${(t.toAccountName || '').replace(/"/g, '""')}"`;
        const category = `"${(t.category || '').replace(/"/g, '""')}"`;


        return [
          rowDate,
          rowTime,
          t.type,
          amount,
          accountName,
          t.type === 'transfer' ? toAccountName : '',
          category,
          remarks
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
    link.setAttribute('download', `assetflow_statement_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
        title: 'Export Successful',
        description: 'Your filtered transaction data has been downloaded.',
    });
  };

  return (
    <Tooltip>
        <TooltipTrigger asChild>
            <Button onClick={handleExport} variant="outline" size="icon" className="h-11 w-11">
                <Download className="mr-0 h-5 w-5" />
            </Button>
        </TooltipTrigger>
        <TooltipContent>
            <p>Export Current View</p>
        </TooltipContent>
    </Tooltip>
  );
}
