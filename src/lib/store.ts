import { createContext, useContext } from 'react';
import type { Account, Transaction } from '@/lib/types';

interface AssetFlowState {
  accounts: Account[];
  transactions: Transaction[];
  addAccount: (name: string, initialBalance: number, showToast?: boolean) => Account;
  editAccount: (id: string, newName: string) => void;
  deleteAccount: (id: string) => void;
  addTransaction: (
    type: 'income' | 'expenditure',
    amount: number,
    accountId: string,
    remarks: string
  ) => void;
  editTransaction: (id: string, newAmount: number, newRemarks: string) => void;
  deleteTransaction: (id: string) => void;
  getAccountById: (id: string) => Account | undefined;
  totalBalance: number;
  isInitialized: boolean;
  currency: string;
  setCurrency: (currency: string) => void;
}

export const AssetFlowContext = createContext<AssetFlowState | undefined>(
  undefined
);

export function useAssetFlow() {
  const context = useContext(AssetFlowContext);
  if (!context) {
    throw new Error('useAssetFlow must be used within an AssetFlowProvider');
  }
  return context;
}
