import type { LucideIcon } from 'lucide-react';
import type { IconName } from './categories';

export type Account = {
  id: string;
  name: string;
  balance: number;
};

export type TransactionType = 'income' | 'expenditure' | 'account_creation' | 'transfer';
export type CategoryType = 'income' | 'expense';

export type Category = {
  id: string;
  name: string;
  icon: IconName | string;
  type: CategoryType;
  isDefault?: boolean;
};

export type Transaction = {
  id: string;
  type: TransactionType;
  amount: number;
  accountId: string; // For income/expense, this is the account. For transfer, this is FROM account.
  accountName?: string;
  date: string; // ISO string
  remarks: string;
  category?: string; // Category ID
  toAccountId?: string; // For transfer, this is TO account
  toAccountName?: string;
};

export type EditableTransaction = {
  amount: number;
  accountId: string;
  remarks: string;
  date: string;
  category?: string;
  toAccountId?: string;
};
