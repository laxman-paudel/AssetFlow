'use client';

import BottomNav from '@/components/app/BottomNav';
import HeaderNav from '@/components/app/HeaderNav';
import { Button } from '@/components/ui/button';
import { PiggyBank, Settings } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const handleSettingsClick = () => {
    if (pathname === '/settings') {
      router.back();
    } else {
      router.push('/settings');
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-20 border-b bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2">
            <PiggyBank className="h-8 w-8 text-primary" />
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              AssetFlow
            </h1>
          </Link>
          <HeaderNav />
          <Button variant="ghost" size="icon" onClick={handleSettingsClick}>
            <Settings className="h-5 w-5" />
            <span className="sr-only">Settings</span>
          </Button>
        </div>
      </header>
      <main key={pathname} className="flex-1 pb-24 md:pb-8 animate-fade-in">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
