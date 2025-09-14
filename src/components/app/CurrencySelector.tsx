'use client';
import { useState, useEffect } from 'react';
import { useAssetFlow } from '@/lib/store';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '../ui/skeleton';

const currencies = [
  { value: 'USD', label: '$ USD' },
  { value: 'NPR', label: 'रू NPR' },
  { value: 'EUR', label: '€ EUR' },
  { value: 'JPY', label: '¥ JPY' },
  { value: 'GBP', label: '£ GBP' },
  { value: 'INR', label: '₹ INR' },
];

export default function CurrencySelector() {
  const { currency, setCurrency, isInitialized } = useAssetFlow();
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient || !isInitialized || !currency) {
    return <Skeleton className="h-10 w-28" />;
  }

  return (
    <Select value={currency} onValueChange={setCurrency}>
      <SelectTrigger className="w-auto min-w-[110px] shadow-none focus:ring-0">
        <SelectValue placeholder="Currency" />
      </SelectTrigger>
      <SelectContent>
        {currencies.map((c) => (
          <SelectItem key={c.value} value={c.value}>
            {c.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
