import BottomNav from '@/components/app/BottomNav';
import { PiggyBank, Settings } from 'lucide-react';
import CurrencySelector from '@/components/app/CurrencySelector';
import ResetButton from '@/components/app/ResetButton';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <PiggyBank className="h-8 w-8 text-primary" />
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              AssetFlow
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <CurrencySelector />
            <Button asChild variant="ghost" size="icon" className="text-muted-foreground">
               <Link href="/settings">
                  <Settings className="h-4 w-4" />
               </Link>
            </Button>
            <ResetButton />
          </div>
        </div>
      </header>
      <main className="flex-1 pb-24">{children}</main>
      <BottomNav />
    </div>
  );
}
