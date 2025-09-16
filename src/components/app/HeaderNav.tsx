'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAssetFlow } from './AppProvider';

const baseNavItems = [
  { href: '/', label: 'Dashboard' },
  { href: '/statement', label: 'Statements' },
  { href: '/assets', label: 'Accounts' },
];

const insightsNavItem = { href: '/insights', label: 'Insights' };


export default function HeaderNav() {
  const pathname = usePathname();
  const { insightsEnabled } = useAssetFlow();
  
  const navItems = insightsEnabled ? [...baseNavItems, insightsNavItem] : baseNavItems;


  return (
    <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'transition-colors hover:text-primary',
              isActive ? 'text-primary' : 'text-muted-foreground'
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
