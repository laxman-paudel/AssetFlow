import type { Metadata } from 'next';
import './globals.css';
import { AppProvider } from '@/components/app/AppProvider';
import { Toaster } from '@/components/ui/toaster';
import { cn } from '@/lib/utils';
import { GeistSans } from 'geist/font/sans';

export const metadata: Metadata = {
  title: 'AssetFlow',
  description: 'Track your income, expenditures, and assets with ease.',
  manifest: '/manifest.json',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          'min-h-screen bg-background font-sans antialiased',
          GeistSans.variable
        )}
      >
        <AppProvider>{children}</AppProvider>
        <Toaster />
      </body>
    </html>
  );
}