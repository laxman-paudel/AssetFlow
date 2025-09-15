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
} from 'lucide-react';
import type { Category } from './types';

export const defaultCategories: Category[] = [
  // Expenses
  { id: 'food', name: 'Food & Dining', icon: UtensilsCrossed },
  { id: 'transport', name: 'Transportation', icon: Car },
  { id: 'housing', name: 'Housing', icon: Home },
  { id: 'health', name: 'Health', icon: Heart },
  { id: 'education', name: 'Education', icon: GraduationCap },
  { id: 'entertainment', name: 'Entertainment', icon: Film },
  { id: 'travel', name: 'Travel', icon: Plane },
  { id: 'shopping', name: 'Shopping', icon: Gift },
  { id: 'bills', name: 'Bills & Utilities', icon: Receipt },
  { id: 'other_expense', name: 'Other Expense', icon: HelpCircle },

  // Income
  { id: 'salary', name: 'Salary', icon: Briefcase },
  { id: 'investment', name: 'Investments', icon: TrendingUp },
  { id: 'savings', name: 'Savings', icon: PiggyBank },
  { id: 'other_income', name: 'Other Income', icon: DollarSign },
];

export const getCategoryById = (id: string) => {
    return defaultCategories.find(c => c.id === id);
}

export const incomeCategories = defaultCategories.filter(c => ['salary', 'investment', 'savings', 'other_income'].includes(c.id));
export const expenseCategories = defaultCategories.filter(c => !['salary', 'investment', 'savings', 'other_income'].includes(c.id));
