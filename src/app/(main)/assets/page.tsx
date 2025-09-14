'use client';

import { useState } from 'react';
import { useAssetFlow } from '@/lib/store';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
import { PlusCircle, Trash2 } from 'lucide-react';
import AssetDialog from '@/components/app/AssetDialog';
import { Skeleton } from '@/components/ui/skeleton';

export default function AssetsPage() {
  const { assets, deleteAsset, isInitialized } = useAssetFlow();
  const [dialogOpen, setDialogOpen] = useState(false);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);

  return (
    <div className="container mx-auto p-4 sm:p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">My Assets</h1>
        <Button onClick={() => setDialogOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" />
          New Asset
        </Button>
      </div>
      <div className="space-y-4">
        {!isInitialized ? (
          <>
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </>
        ) : assets.length > 0 ? (
          assets.map((asset) => (
            <Card key={asset.id}>
              <CardHeader className="flex flex-row items-start justify-between">
                <div>
                  <CardTitle>{asset.name}</CardTitle>
                  <CardDescription>Available Balance</CardDescription>
                </div>
                 <AlertDialog>
                    <AlertDialogTrigger asChild>
                       <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                       </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete your asset.
                                You can only delete assets with no transactions.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteAsset(asset.id)} className="bg-destructive hover:bg-destructive/90">
                                Delete
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold tracking-tight">
                  {formatCurrency(asset.balance)}
                </p>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card className="text-center py-10">
            <CardContent>
              <p className="text-muted-foreground">No assets found.</p>
              <p className="text-muted-foreground">Click "New Asset" to get started.</p>
            </CardContent>
          </Card>
        )}
      </div>
      <AssetDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}
