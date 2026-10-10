import type { Metadata } from 'next';
import './globals.css';

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
      <body className="min-h-screen antialiased bg-brand-bg text-brand-text-primary">
        {children}
      </body>
    </html>
  );
}
