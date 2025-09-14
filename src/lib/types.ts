export type Asset = {
  id: string;
  name: string;
  balance: number;
};

export type TransactionType = 'income' | 'expenditure';

export type Transaction = {
  id: string;
  type: TransactionType;
  amount: number;
  assetId: string;
  date: string; // ISO string
  remarks: string;
};
