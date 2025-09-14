'use client';

import { useState } from 'react';
import { useAssetFlow } from '@/lib/store';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
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
import { PlusCircle, Trash2, Landmark, Wallet, CreditCard, HelpCircle } from 'lucide-react';
import AssetDialog from '@/components/app/AssetDialog';
import { Skeleton } from '@/components/ui/skeleton';

export default function AssetsPage() {
  const { assets, deleteAsset, isInitialized, currency } = useAssetFlow();
  const [dialogOpen, setDialogOpen] = useState(false);

  const formatCurrency = (amount: number) => {
    if (!currency) return '...';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  }
  
  const getAssetIcon = (assetName: string) => {
    const lowerCaseName = assetName.toLowerCase();
    if (lowerCaseName.includes('bank')) {
      return <Landmark className="h-6 w-6 text-muted-foreground" />;
    }
     if (lowerCaseName.includes('card') || lowerCaseName.includes('credit')) {
      return <CreditCard className="h-6 w-6 text-muted-foreground" />;
    }
    if (lowerCaseName.includes('cash') || lowerCaseName.includes('wallet')) {
      return <Wallet className="h-6 w-6 text-muted-foreground" />;
    }
    return <HelpCircle className="h-6 w-6 text-muted-foreground" />;
  };

  return (
    <div className="container mx-auto p-4 sm:p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold tracking-tight">My Assets</h1>
        <Button onClick={() => setDialogOpen(true)} className='h-11'>
          <PlusCircle className="mr-2 h-4 w-4" />
          New Asset
        </Button>
      </div>
      <div className="space-y-4">
        {!isInitialized ? (
          <>
            <Skeleton className="h-28 w-full" />
            <Skeleton className="h-28 w-full" />
          </>
        ) : assets.length > 0 ? (
          assets.map((asset) => (
            <Card key={asset.id} className="transition-all hover:shadow-lg hover:-translate-y-1 duration-300">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="flex items-center gap-4">
                   {getAssetIcon(asset.name)}
                   <div>
                      <CardTitle className="tracking-tight">{asset.name}</CardTitle>
                      <CardDescription>Available Balance</CardDescription>
                   </div>
                </div>
                 <AlertDialog>
                    <AlertDialogTrigger asChild>
                       <Button variant="ghost" size="icon" className="text-destructive/60 hover:text-destructive hover:bg-destructive/10">
                          <Trash2 className="h-4 w-4" />
                       </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                               This action cannot be undone. This will permanently delete your asset and its balance. The transaction history will be preserved.
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
              <CardContent className="pl-16">
                <p className="text-3xl font-bold tracking-tight">
                  {formatCurrency(asset.balance)}
                </p>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center text-center py-10 border-2 border-dashed rounded-lg">
             <div className="p-4 bg-secondary rounded-full mb-4">
               <Wallet className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No Assets Found</h3>
            <p className="text-muted-foreground mb-4">Get started by creating your first financial asset.</p>
            <Button onClick={() => setDialogOpen(true)}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Create First Asset
            </Button>
          </div>
        )}
      </div>
      <AssetDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}
