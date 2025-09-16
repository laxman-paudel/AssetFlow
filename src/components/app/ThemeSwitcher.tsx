'use client';

import * as React from 'react';
import { Moon, Sun, Monitor } from 'lucide-react';
import { useTheme } from 'next-themes';

import { Button } from '@/components/ui/button';

export default function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  
  const themes = [
    { name: 'Light', icon: Sun, value: 'light' },
    { name: 'Dark', icon: Moon, value: 'dark' },
    { name: 'System', icon: Monitor, value: 'system' },
  ];

  return (
    <div className="flex items-center space-x-2 rounded-lg bg-muted p-1">
      {themes.map((t) => (
        <Button
          key={t.value}
          variant={theme === t.value ? 'outline' : 'ghost'}
          size="sm"
          className={`w-full justify-center ${theme === t.value ? 'bg-background shadow-sm' : ''}`}
          onClick={() => setTheme(t.value)}
        >
          <t.icon className="mr-2 h-4 w-4" />
          {t.name}
        </Button>
      ))}
    </div>
  );
}
