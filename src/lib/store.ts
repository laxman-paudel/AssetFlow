import { createContext, useContext } from 'react';
import type { Asset, Transaction } from '@/lib/types';

interface AssetFlowState {
  assets: Asset[];
  transactions: Transaction[];
  addAsset: (name: string, initialBalance: number) => void;
  deleteAsset: (id: string) => void;
  addTransaction: (
    type: 'income' | 'expenditure',
    amount: number,
    assetId: string,
    remarks: string
  ) => void;
  deleteTransaction: (id: string) => void;
  getAssetById: (id: string) => Asset | undefined;
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
