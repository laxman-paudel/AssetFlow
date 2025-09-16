import type { Metadata } from 'next';
import './globals.css';
import { AppProvider } from '@/components/app/AppProvider';
import { ThemeProvider } from '@/components/app/ThemeProvider';
import { Toaster } from '@/components/ui/toaster';
import { cn } from '@/lib/utils';
import { PT_Sans } from 'next/font/google';

const ptSans = PT_Sans({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-sans',
});

export const metadata: Metadata = {
  title: 'AssetFlow',
  description: 'Track your income, expenditures, and assets with ease.',
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/favicon.ico?v=1', sizes: 'any' },
      { url: '/icon.svg?v=1', type: 'image/svg+xml' },
    ],
    apple: '/apple-touch-icon.png?v=1',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#8FBC8F" />
      </head>
      <body
        className={cn(
          'min-h-screen bg-background font-sans antialiased',
          ptSans.variable
        )}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AppProvider>{children}</AppProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
