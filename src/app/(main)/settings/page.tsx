'use client';

import { useState, useEffect } from 'react';
import ThemeSwitcher from '@/components/app/ThemeSwitcher';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import CurrencySelector from '@/components/app/CurrencySelector';
import ExportButton from '@/components/app/ExportButton';
import ResetButton from '@/components/app/ResetButton';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { useAssetFlow } from '@/components/app/AppProvider';
import CategoryList from '@/components/app/CategoryList';


function SettingsContent() {
  const { categoriesEnabled, toggleCategories } = useAssetFlow();
  
  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
          <CardDescription>
            Customize the look and feel of your application.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Label>Theme</Label>
            <ThemeSwitcher />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>General</CardTitle>
          <CardDescription>
            Manage your application-wide settings.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <Label>Primary Currency</Label>
            <CurrencySelector />
          </div>
        </CardContent>
      </Card>

      <Card>
          <CardHeader>
              <CardTitle>Category Management</CardTitle>
              <CardDescription>
                  Manage your income and expense categories.
              </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between rounded-lg border p-4 gap-4">
                  <div className="flex-1">
                      <h4 className="font-semibold">Enable Categories</h4>
                      <p className="text-sm text-muted-foreground">
                          Turn transaction categorization on or off globally.
                      </p>
                  </div>
                  <Switch
                      checked={categoriesEnabled}
                      onCheckedChange={toggleCategories}
                      aria-label="Toggle transaction categories"
                  />
              </div>
              {categoriesEnabled && <CategoryList />}
          </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Data Management</CardTitle>
          <CardDescription>
            Export your transaction data to a CSV file.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ExportButton />
        </CardContent>
      </Card>

      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
          <CardDescription>
            These actions are permanent and cannot be undone.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold">Reset Application</h4>
            <p className="text-sm text-muted-foreground mb-2">
              Delete all your accounts, transactions, and settings.
            </p>
            <ResetButton />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function SettingsSkeleton() {
    return (
        <div className="space-y-8">
            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-4 w-48" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-10 w-full" />
                </CardContent>
            </Card>
             <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-24" />
                    <Skeleton className="h-4 w-40" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-10 w-full" />
                </CardContent>
            </Card>
             <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-40" />
                    <Skeleton className="h-4 w-52" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-10 w-48" />
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-4 w-48" />
                </CardHeader>
                <CardContent>
                     <Skeleton className="h-4 w-64 mb-2" />
                    <Skeleton className="h-10 w-32" />
                </CardContent>
            </Card>
        </div>
    )
}

function SettingsHydrated() {
  const [isClient, setIsClient] = useState(false);
  useEffect(() => {
    setIsClient(true);
  }, []);

  return isClient ? <SettingsContent /> : <SettingsSkeleton />;
}

export default function SettingsPage() {
  return (
    <div className="container mx-auto p-4 sm:p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
      </div>
      <SettingsHydrated />
    </div>
  );
}
