import BottomNav from '@/components/app/BottomNav';
import { PiggyBank } from 'lucide-react';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 border-b bg-card/80 backdrop-blur-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <PiggyBank className="h-8 w-8 text-primary" />
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              AssetFlow
            </h1>
          </div>
        </div>
      </header>
      <main className="flex-1 pb-24">{children}</main>
      <BottomNav />
    </div>
  );
}
