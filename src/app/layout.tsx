import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Wealth Tracker: unde se duc banii casei',
  description:
    'Vezi cheltuielile casei la un loc și cum evoluează de la o lună la alta. Asistentul caută prin tranzacțiile voastre obiceiurile care costă și locurile unde puteți economisi.',
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
