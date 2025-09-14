'use client';

import { useAssetFlow } from '@/lib/store';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const currencies = [
  { value: 'USD', label: '$ USD' },
  { value: 'EUR', label: '€ EUR' },
  { value: 'JPY', label: '¥ JPY' },
  { value: 'GBP', label: '£ GBP' },
  { value: 'INR', label: '₹ INR' },
  { value: 'NPR', label: 'रू NPR' },
];

export default function CurrencySelector() {
  const { currency, setCurrency, isInitialized } = useAssetFlow();

  if (!isInitialized) return null;

  return (
    <Select value={currency} onValueChange={setCurrency}>
      <SelectTrigger className="w-auto border-none bg-transparent shadow-none text-muted-foreground focus:ring-0">
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
