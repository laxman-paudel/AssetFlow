'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { RotateCcw } from 'lucide-react';
import { auth, db } from '@/lib/firebase';
import { collection, getDocs, writeBatch, doc, deleteDoc } from 'firebase/firestore';
import { useAssetFlow } from '@/components/app/AppProvider';
import { useToast } from '@/hooks/use-toast';

export default function ResetButton() {
  const { user } = useAssetFlow();
  const { toast } = useToast();

  const handleReset = async () => {
    if (!user) {
      toast({ title: 'Error', description: 'You must be logged in to reset.', variant: 'destructive' });
      return;
    }
    try {
      // 1. Delete all transactions
      const transactionsRef = collection(db, 'users', user.uid, 'transactions');
      const transactionsSnap = await getDocs(transactionsRef);
      const batch = writeBatch(db);
      transactionsSnap.forEach(doc => batch.delete(doc.ref));

      // 2. Delete all accounts
      const accountsRef = collection(db, 'users', user.uid, 'accounts');
      const accountsSnap = await getDocs(accountsRef);
      accountsSnap.forEach(doc => batch.delete(doc.ref));

      // 3. Delete the user document itself
      const userDocRef = doc(db, 'users', user.uid);
      batch.delete(userDocRef);
      
      await batch.commit();

      // Sign out
      await auth.signOut();
      
      toast({ title: 'Application Reset', description: 'Your data has been cleared.' });
      
      // Force a reload to trigger the initial setup flow
      window.location.href = '/auth';

    } catch (error) {
      console.error("Error resetting application: ", error);
      toast({ title: 'Reset Failed', description: 'Could not reset your data. Please try again.', variant: 'destructive' });
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive">
          <RotateCcw className="mr-2 h-4 w-4" />
          Reset App
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete all your
            accounts, transactions, and settings from the cloud.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleReset}
            className="bg-destructive hover:bg-destructive/90"
          >
            Reset App
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
