import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Wealth Tracker: cheltuielile casei, în doi',
  description:
    'Încărcați extrasele de cont, iar aplicația le împarte pe categorii, vă arată unde se duc banii și răspunde la întrebări despre cheltuielile casei.',
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f6f3ee' },
    { media: '(prefers-color-scheme: dark)', color: '#151311' },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ro">
      <body>{children}</body>
    </html>
  );
}
