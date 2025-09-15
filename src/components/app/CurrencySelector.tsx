'use client';
import { useAssetFlow } from '@/components/app/AppProvider';
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
  const { currency, changeCurrency, isInitialized } = useAssetFlow();

  if (!isInitialized || !currency) {
    return <Skeleton className="h-10 w-28" />;
  }

  return (
    <Select value={currency} onValueChange={changeCurrency}>
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
