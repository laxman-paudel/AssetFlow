'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
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

interface CurrencySetupDialogProps {
  open: boolean;
  onCurrencySelect: (currency: string) => void;
}

export default function CurrencySetupDialog({ open, onCurrencySelect }: CurrencySetupDialogProps) {
  const [selectedCurrency, setSelectedCurrency] = useState<string>('');

  const handleSave = () => {
    if (selectedCurrency) {
      onCurrencySelect(selectedCurrency);
    }
  };

  return (
    <Dialog open={open}>
      <DialogContent className="sm:max-w-[425px]" hideCloseButton={true}>
        <DialogHeader>
          <DialogTitle>Welcome to AssetFlow!</DialogTitle>
          <DialogDescription>
            To get started, please select your primary currency. You can change this later in the settings.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
            <Select onValueChange={setSelectedCurrency} value={selectedCurrency}>
                <SelectTrigger>
                    <SelectValue placeholder="Select a currency" />
                </SelectTrigger>
                <SelectContent>
                    {currencies.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                        {c.label}
                    </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
        <DialogFooter>
          <Button type="button" onClick={handleSave} disabled={!selectedCurrency}>
            Save and Continue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
