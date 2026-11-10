import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Wealth Tracker: cheltuielile casei, în doi',
  description:
    'Încarci extrasele de la bancă, iar Wealth Tracker pune fiecare plată la categoria ei. Tu și partenerul vedeți aceleași cifre, fără tabele completate de mână.',
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
