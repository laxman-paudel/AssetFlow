export type Account = {
  id: string;
  name: string;
  balance: number;
};

export type TransactionType = 'income' | 'expenditure' | 'account_creation';

export type Transaction = {
  id: string;
  type: TransactionType;
  amount: number;
  accountId: string;
  accountName?: string;
  date: string; // ISO string
  remarks: string;
};
