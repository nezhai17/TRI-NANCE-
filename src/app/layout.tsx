import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Tri-nance | Financial Sentiment & Risk Intelligence',
  description:
    'Analyze financial reports, comments, write-ups, and customer text to identify sentiment, uncover potential financial risk patterns, and present evidence-backed intelligence.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} min-h-screen antialiased bg-brand-bg text-brand-text-primary font-sans`}>
        {children}
      </body>
    </html>
  );
}
