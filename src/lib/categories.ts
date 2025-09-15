import {
  Car,
  Home,
  UtensilsCrossed,
  Heart,
  GraduationCap,
  Gift,
  Film,
  Plane,
  Briefcase,
  DollarSign,
  Receipt,
  PiggyBank,
  TrendingUp,
  HelpCircle,
  Shapes,
} from 'lucide-react';
import type { Category } from './types';

export const defaultCategories: Category[] = [
  // Expenses
  { id: 'food', name: 'Food & Dining', icon: UtensilsCrossed, type: 'expense' },
  { id: 'transport', name: 'Transportation', icon: Car, type: 'expense' },
  { id: 'housing', name: 'Housing', icon: Home, type: 'expense' },
  { id: 'health', name: 'Health', icon: Heart, type: 'expense' },
  { id: 'education', name: 'Education', icon: GraduationCap, type: 'expense' },
  { id: 'entertainment', name: 'Entertainment', icon: Film, type: 'expense' },
  { id: 'travel', name: 'Travel', icon: Plane, type: 'expense' },
  { id: 'shopping', name: 'Shopping', icon: Gift, type: 'expense' },
  { id: 'bills', name: 'Bills & Utilities', icon: Receipt, type: 'expense' },
  { id: 'other_expense', name: 'Other Expense', icon: HelpCircle, type: 'expense' },

  // Income
  { id: 'salary', name: 'Salary', icon: Briefcase, type: 'income' },
  { id: 'investment', name: 'Investments', icon: TrendingUp, type: 'income' },
  { id: 'savings', name: 'Savings', icon: PiggyBank, type: 'income' },
  { id: 'other_income', name: 'Other Income', icon: DollarSign, type: 'income' },
];

export const getCategoryById = (id: string, customCategories: Category[] = []) => {
    const allCategories = [...defaultCategories, ...customCategories.map(c => ({...c, icon: Shapes}))];
    return allCategories.find(c => c.id === id);
}

export const getIncomeCategories = (customCategories: Category[] = []) => {
    return [
        ...defaultCategories.filter(c => c.type === 'income'),
        ...customCategories.filter(c => c.type === 'income')
    ];
};

export const getExpenseCategories = (customCategories: Category[] = []) => {
    return [
        ...defaultCategories.filter(c => c.type === 'expense'),
        ...customCategories.filter(c => c.type === 'expense')
    ];
};
