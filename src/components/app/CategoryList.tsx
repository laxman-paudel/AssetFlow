'use client';

import { useState } from 'react';
import { useAssetFlow } from '@/components/app/AppProvider';
import { Button } from '@/components/ui/button';
import { PlusCircle, Edit, Trash2, HelpCircle } from 'lucide-react';
import CategoryDialog from '@/components/app/CategoryDialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import type { Category } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import EditCategoryDialog from './EditCategoryDialog';
import { getIconByName } from '@/lib/categories';

export default function CategoryList() {
  const { categories, deleteCategory } = useAssetFlow();

  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [categoryToEdit, setCategoryToEdit] = useState<Category | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);

  const handleDelete = () => {
    if (categoryToDelete) {
      deleteCategory(categoryToDelete.id);
      setCategoryToDelete(null);
    }
  };

  return (
    <>
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h4 className="font-semibold">Your Categories</h4>
          <Button variant="outline" size="sm" onClick={() => setCategoryDialogOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Category
          </Button>
        </div>
        <div className="space-y-2 rounded-lg border p-4">
          {categories && categories.length > 0 ? (
            categories.map((category) => {
              const Icon = getIconByName(category.icon);
              return (
                <div key={category.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Icon className="h-5 w-5 text-muted-foreground" />
                        <span className="font-medium">{category.name}</span>
                        <Badge variant={category.type === 'income' ? 'default' : 'destructive'} className="capitalize">
                            {category.type}
                        </Badge>
                    </div>
                    <div className='flex items-center'>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setCategoryToEdit(category)}>
                        <Edit className="h-4 w-4" />
                    </Button>
                    {!category.isDefault && (
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setCategoryToDelete(category)}>
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    )}
                    </div>
                </div>
              );
            })
          ) : (
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <HelpCircle className="h-10 w-10 text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">You haven't created any categories yet.</p>
            </div>
          )}
        </div>
      </div>
      
      <CategoryDialog 
        open={categoryDialogOpen} 
        onOpenChange={setCategoryDialogOpen} 
        onCategoryCreated={() => {}} // No need to do anything here, list will re-render
        type="expense" // Default type, user can change it
      />

      {categoryToEdit && (
        <EditCategoryDialog
            key={categoryToEdit.id}
            category={categoryToEdit}
            open={!!categoryToEdit}
            onOpenChange={(isOpen) => !isOpen && setCategoryToEdit(null)}
        />
      )}

      <AlertDialog open={!!categoryToDelete} onOpenChange={(isOpen) => !isOpen && setCategoryToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the &quot;{categoryToDelete?.name}&quot; category. Transactions using this category will be uncategorized.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
