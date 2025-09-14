'use client';

import ResetButton from '@/components/app/ResetButton';
import ThemeSwitcher from '@/components/app/ThemeSwitcher';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import CurrencySelector from '@/components/app/CurrencySelector';
import ExportButton from '@/components/app/ExportButton';

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
            <CardTitle>Data Management</CardTitle>
            <CardDescription>
              Manage your application data. Exports include all transactions.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <ExportButton />
          </CardFooter>
        </Card>

        <Card className="border-destructive">
          <CardHeader>
            <CardTitle>Danger Zone</CardTitle>
            <CardDescription>
              These actions are destructive and cannot be undone. Please be
              certain before proceeding.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <p className="text-sm font-medium flex-1">Reset Application</p>
            <ResetButton />
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
