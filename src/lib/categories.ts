import * as LucideIcons from 'lucide-react';
import type { Category, CategoryType } from './types';

// A list of icons that can be assigned to categories.
export const assignableIcons = [
    'Shapes', 'Gift', 'UtensilsCrossed', 'Home', 'Car', 'Heart', 'GraduationCap', 'Film', 'Plane', 'Briefcase', 'Receipt', 'Bus', 'Train', 'ShoppingBag', 'Shirt', 'Coffee', 'Pizza', 'Bone', 'Laptop', 'Gamepad2', 'Music', 'BookOpen', 'TrendingUp', 'PiggyBank', 'DollarSign'
] as const;

export type IconName = typeof assignableIcons[number];

export const iconMap: { [key in IconName]: LucideIcons.LucideIcon } = {
    Shapes: LucideIcons.Shapes,
    Gift: LucideIcons.Gift,
    UtensilsCrossed: LucideIcons.UtensilsCrossed,
    Home: LucideIcons.Home,
    Car: LucideIcons.Car,
    Heart: LucideIcons.Heart,
    GraduationCap: LucideIcons.GraduationCap,
    Film: LucideIcons.Film,
    Plane: LucideIcons.Plane,
    Briefcase: LucideIcons.Briefcase,
    Receipt: LucideIcons.Receipt,
    Bus: LucideIcons.Bus,
    Train: LucideIcons.Train,
    ShoppingBag: LucideIcons.ShoppingBag,
    Shirt: LucideIcons.Shirt,
    Coffee: LucideIcons.Coffee,
    Pizza: LucideIcons.Pizza,
    Bone: LucideIcons.Bone,
    Laptop: LucideIcons.Laptop,
    Gamepad2: LucideIcons.Gamepad2,
    Music: LucideIcons.Music,
    BookOpen: LucideIcons.BookOpen,
    TrendingUp: LucideIcons.TrendingUp,
    PiggyBank: LucideIcons.PiggyBank,
    DollarSign: LucideIcons.DollarSign,
};

export const getIconByName = (name: string): LucideIcons.LucideIcon => {
    return iconMap[name as IconName] || LucideIcons.HelpCircle;
}

export const defaultCategories: Category[] = [
  // Expenses
  { id: 'food', name: 'Food & Dining', icon: 'UtensilsCrossed', type: 'expense', isDefault: true },
  { id: 'transport', name: 'Transportation', icon: 'Car', type: 'expense', isDefault: true },
  { id: 'housing', name: 'Housing', icon: 'Home', type: 'expense', isDefault: true },
  { id: 'health', name: 'Health', icon: 'Heart', type: 'expense', isDefault: true },
  { id: 'education', name: 'Education', icon: 'GraduationCap', type: 'expense', isDefault: true },
  { id: 'entertainment', name: 'Entertainment', icon: 'Film', type: 'expense', isDefault: true },
  { id: 'travel', name: 'Travel', icon: 'Plane', type: 'expense', isDefault: true },
  { id: 'shopping', name: 'Shopping', icon: 'Gift', type: 'expense', isDefault: true },
  { id: 'bills', name: 'Bills & Utilities', icon: 'Receipt', type: 'expense', isDefault: true },
  { id: 'other_expense', name: 'Other Expense', icon: 'Shapes', type: 'expense', isDefault: true },

  // Income
  { id: 'salary', name: 'Salary', icon: 'Briefcase', type: 'income', isDefault: true },
  { id: 'investment', name: 'Investments', icon: 'TrendingUp', type: 'income', isDefault: true },
  { id: 'savings', name: 'Savings', icon: 'PiggyBank', type: 'income', isDefault: true },
  { id: 'other_income', name: 'Other Income', icon: 'DollarSign', type: 'income', isDefault: true },
];

export const getCategoryById = (id: string, allCategories: Category[] = []) => {
    return allCategories.find(c => c.id === id);
}

export const getCategoriesByType = (allCategories: Category[], type: CategoryType) => {
    return allCategories.filter(c => c.type === type);
};

export const getIncomeCategories = (allCategories: Category[] = []) => {
    return getCategoriesByType(allCategories, 'income');
};

export const getExpenseCategories = (allCategories: Category[] = []) => {
    return getCategoriesByType(allCategories, 'expense');
};
