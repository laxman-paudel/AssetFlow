'use client';

import * as React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/components/app/ThemeProvider';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const themes = [
  { name: 'Forest', value: 'theme-forest', colors: ['bg-[#5f937c]', 'bg-[#f2eadf]'] },
  { name: 'Mint', value: 'theme-mint', colors: ['bg-[#50b892]', 'bg-[#e2f5d8]'] },
  { name: 'Ocean', value: 'theme-ocean', colors: ['bg-[#407BFF]', 'bg-[#dce9ff]'] },
  { name: 'Sunset', value: 'theme-sunset', colors: ['bg-[#f07144]', 'bg-[#fae6d7]'] },
  { name: 'Graphite', value: 'theme-graphite', colors: ['bg-[#4d4d5c]', 'bg-[#dfe0e2]'] },
] as const;

export default function ThemeSelector() {
  const { theme, setTheme, colorTheme, setColorTheme } = useTheme();

  return (
    <TooltipProvider>
      <div className="space-y-4">
        <div className="flex items-center space-x-2 rounded-lg bg-muted p-1">
          <Button
            variant={theme === 'light' ? 'outline' : 'ghost'}
            size="sm"
            className={`w-full justify-center ${theme === 'light' ? 'bg-background shadow-sm' : ''}`}
            onClick={() => setTheme('light')}
          >
            <Sun className="mr-2 h-4 w-4" />
            Light
          </Button>
          <Button
            variant={theme === 'dark' ? 'outline' : 'ghost'}
            size="sm"
            className={`w-full justify-center ${theme === 'dark' ? 'bg-background shadow-sm' : ''}`}
            onClick={() => setTheme('dark')}
          >
            <Moon className="mr-2 h-4 w-4" />
            Dark
          </Button>
        </div>
        <div className="grid grid-cols-5 gap-3">
          {themes.map((t) => (
            <Tooltip key={t.value}>
              <TooltipTrigger asChild>
                <button
                  className={cn(
                    'h-12 w-full rounded-lg flex items-center justify-center ring-2 ring-offset-2 ring-offset-background transition-all',
                    colorTheme === t.value ? 'ring-primary' : 'ring-transparent hover:ring-primary/50'
                  )}
                  onClick={() => setColorTheme(t.value)}
                >
                  <div className="flex -space-x-2 overflow-hidden">
                    <div className={cn('h-6 w-6 rounded-full', t.colors[0])}></div>
                    <div className={cn('h-6 w-6 rounded-full', t.colors[1])}></div>
                  </div>
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{t.name}</p>
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
      </div>
    </TooltipProvider>
  );
}
