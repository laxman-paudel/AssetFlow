'use client';

import ResetButton from '@/components/app/ResetButton';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default function SettingsPage() {
  return (
    <div className="container mx-auto p-4 sm:p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
      </div>
      <div className="space-y-8">
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle>Danger Zone</CardTitle>
            <CardDescription>
              These actions are destructive and cannot be undone. Please be
              certain before proceeding.
            </CardDescription>
          </CardHeader>
          <CardFooter className="flex justify-between items-center">
            <p className="text-sm font-medium">Reset Application</p>
            <ResetButton />
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
