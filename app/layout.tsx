import type { Metadata } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
// Google Fonts disabled for build compatibility
// import { Inter } from 'next/font/google';
import './globals.css';

// font disabled;

export const metadata: Metadata = {
  title: 'VCC Hub | Techosystem',
  description: 'Private portal for Techosystem VC Committee members',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="">
      <body>
        <ClerkProvider>
          {children}
        </ClerkProvider>
      </body>
    </html>
  );
}
