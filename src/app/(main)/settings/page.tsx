'use client';

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
import { Separator } from '@/components/ui/separator';

export default function SettingsPage() {
  return (
    <div className="container mx-auto p-4 sm:p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
      </div>
      <div className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Appearance</CardTitle>
            <CardDescription>
              Customize the look and feel of your application.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
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
            </Header>
            <CardContent>
                <div className="flex items-center justify-between">
                    <Label>Primary Currency</Label>
                    <CurrencySelector />
                </div>
            </CardContent>
        </Card>
        
        <Card>
            <CardHeader>
                <CardTitle>Data Management</CardTitle>
                <CardDescription>
                    Export your transaction data to a CSV file.
                </CardDescription>
            </Header>
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
            </Header>
            <CardContent className="space-y-4">
               <div>
                    <h4 className="font-semibold">Reset Application</h4>
                    <p className="text-sm text-muted-foreground mb-2">Delete all your accounts, transactions, and settings.</p>
                    <ResetButton />
               </div>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
