export type Account = {
  id: string;
  name: string;
  balance: number;
};

export type TransactionType = 'income' | 'expenditure' | 'account_creation';

export type Category = {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
};

export type Transaction = {
  id: string;
  type: TransactionType;
  amount: number;
  accountId: string;
  accountName?: string;
  date: string; // ISO string
  remarks: string;
  category?: string; // Category ID
};

export type EditableTransaction = {
  amount: number;
  accountId: string;
  remarks: string;
  date: string;
  category?: string;
};
