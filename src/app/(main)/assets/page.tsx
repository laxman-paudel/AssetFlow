'use client';

import { useState, useEffect } from 'react';
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
import { PlusCircle, Trash2, Landmark, Wallet, CreditCard, HelpCircle, Pencil } from 'lucide-react';
import AssetDialog from '@/components/app/AssetDialog';
import { Skeleton } from '@/components/ui/skeleton';
import EditAssetDialog from '@/components/app/EditAssetDialog';
import { Asset } from '@/lib/types';
import Link from 'next/link';

export default function AssetsPage() {
  const { assets, deleteAsset, isInitialized, currency, totalBalance } = useAssetFlow();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
  }, []);

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

  const getBalanceCardStyle = () => {
    if (!isClient || !isInitialized) return {};

    const maxAmount = 5000;
    const intensity = Math.min(Math.abs(totalBalance) / maxAmount, 1);

    if (totalBalance > 0) {
      const lightness = 80 - intensity * 30;
      return { backgroundColor: `hsl(120, 60%, ${lightness}%)` };
    }
    if (totalBalance < 0) {
      const lightness = 80 - intensity * 25;
      return { backgroundColor: `hsl(0, 70%, ${lightness}%)` };
    }
    return { backgroundColor: 'hsl(210, 80%, 70%)' };
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
      {isClient && isInitialized && assets.length > 0 && (
        <Link href="/" className="block mb-6">
            <Card 
                className='text-primary-foreground shadow-md transition-all duration-300 hover:shadow-lg'
                style={getBalanceCardStyle()}
            >
                <CardContent className="p-3 flex items-center justify-between">
                    <p className="text-sm font-medium">Total Balance</p>
                    <p className="text-lg font-bold tracking-tighter">
                        {formatCurrency(totalBalance)}
                    </p>
                </CardContent>
            </Card>
        </Link>
      )}
      <div className="space-y-4">
        {!isClient || !isInitialized ? (
          <>
            <Skeleton className="h-28 w-full" />
            <Skeleton className="h-28 w-full" />
          </>
        ) : (
          assets.map((asset) => (
            <Card key={asset.id} className="transition-all hover:shadow-lg hover:-translate-y-1 duration-300 group border-l-4 border-l-primary/20 hover:border-l-primary/60">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="flex items-center gap-4">
                   {getAssetIcon(asset.name)}
                   <div>
                      <CardTitle className="tracking-tight">{asset.name}</CardTitle>
                      <CardDescription>Available Balance</CardDescription>
                   </div>
                </div>
                <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground" onClick={() => setEditingAsset(asset)}>
                        <Pencil className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                           <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-destructive/60 hover:text-destructive hover:bg-destructive/10">
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
                </div>
              </CardHeader>
              <CardContent className="pl-16">
                <p className="text-3xl font-bold tracking-tight">
                  {formatCurrency(asset.balance)}
                </p>
              </CardContent>
            </Card>
          ))
        )}
        {isClient && isInitialized && assets.length > 0 && (
            <div className="flex flex-col items-center justify-center text-center py-10 border-2 border-dashed rounded-lg">
                <div className="p-4 bg-secondary rounded-full mb-4">
                    <PlusCircle className="h-10 w-10 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Add Another Asset</h3>
                <p className="text-muted-foreground mb-4">You can add more accounts, like credit cards or other savings.</p>
                <Button onClick={() => setDialogOpen(true)}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Create New Asset
                </Button>
            </div>
        )}
         {isClient && isInitialized && assets.length === 0 && (
          <div className="flex flex-col items-center justify-center text-center py-20 border-2 border-dashed rounded-lg">
            <div className="p-4 bg-primary/10 rounded-full mb-4">
              <Wallet className="h-12 w-12 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Create Your First Asset</h3>
            <p className="text-muted-foreground mb-6 max-w-sm">
              Start by adding a bank account, credit card, or cash to track your balance.
            </p>
            <Button onClick={() => setDialogOpen(true)} size="lg">
              <PlusCircle className="mr-2 h-5 w-5" />
              Add First Asset
            </Button>
          </div>
        )}
      </div>
      <AssetDialog open={dialogOpen} onOpenChange={setDialogOpen} />
      {editingAsset && (
        <EditAssetDialog
          key={editingAsset.id}
          asset={editingAsset}
          open={!!editingAsset}
          onOpenChange={(open) => !open && setEditingAsset(null)}
        />
      )}
    </div>
  );
}
