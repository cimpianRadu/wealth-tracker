'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { TrendingUp, BarChart3, Shield, Menu, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useState } from 'react';
import { useWealthStore } from '@/lib/store';

function CurrencyLabel({ currency }: { currency: string }) {
  switch (currency) {
    case 'RON':
      return <><span>🇷🇴</span> RON</>;
    case 'EUR':
      return <><span className="font-bold text-blue-600">€</span> EUR</>;
    case 'USD':
      return <><span className="font-bold text-green-600">$</span> USD</>;
    default:
      return <>{currency}</>;
  }
}

const navLinks = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/analiza', label: 'Analiză' },
  { href: '/recommendations', label: 'Recomandări' },
  { href: '/settings', label: 'Setări' },
  { href: '/privacy', label: 'Confidențialitate' },
];

function BackupStatusIndicator({ lastBackupDate }: { lastBackupDate: string | null }) {
  if (!lastBackupDate) {
    return (
      <Link
        href="/settings"
        className="flex items-center gap-1 text-xs text-amber-600 hover:text-amber-700 transition-colors"
        title="Niciun backup realizat"
      >
        <AlertTriangle className="h-3.5 w-3.5" />
        <span className="hidden lg:inline">Fără backup</span>
      </Link>
    );
  }

  const daysSince = Math.floor(
    (Date.now() - new Date(lastBackupDate).getTime()) / (1000 * 60 * 60 * 24)
  );
  const isStale = daysSince > 7;

  return (
    <Link
      href="/settings"
      className={`flex items-center gap-1 text-xs transition-colors ${
        isStale ? 'text-amber-600 hover:text-amber-700' : 'text-green-600 hover:text-green-700'
      }`}
      title={`Ultimul backup: ${new Date(lastBackupDate).toLocaleDateString('ro-RO')}`}
    >
      {isStale ? (
        <AlertTriangle className="h-3.5 w-3.5" />
      ) : (
        <CheckCircle2 className="h-3.5 w-3.5" />
      )}
      <span className="hidden lg:inline">
        {daysSince === 0 ? 'Backup azi' : `${daysSince}z de la backup`}
      </span>
    </Link>
  );
}

export function Header() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { assets, debts, displayCurrency, lastBackupDate, isLoading } = useWealthStore();

  const hasData = !isLoading && (assets.length > 0 || debts.length > 0);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg">
          <TrendingUp className="h-5 w-5 text-primary" />
          <span>WealthTracker</span>
          <span className="text-xs bg-primary text-primary-foreground px-1.5 py-0.5 rounded font-normal">
            RO
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map(link => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm px-3 py-1.5 rounded-md transition-colors ${
                  isActive
                    ? 'bg-muted font-medium text-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
          {hasData ? (
            <div className="flex items-center gap-3">
              <Link
                href="/settings"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                <CurrencyLabel currency={displayCurrency} />
              </Link>
              <BackupStatusIndicator lastBackupDate={lastBackupDate} />
            </div>
          ) : (
            <Link href="/dashboard">
              <Button size="sm">
                <BarChart3 className="h-4 w-4 mr-1" />
                Începe Acum
              </Button>
            </Link>
          )}
        </nav>

        {/* Mobile nav */}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-72">
            <nav className="flex flex-col gap-1 mt-6">
              {navLinks.map(link => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`text-base py-2.5 px-3 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-muted font-medium text-foreground'
                        : 'hover:bg-muted'
                    }`}
                    onClick={() => setOpen(false)}
                  >
                    {link.label}
                  </Link>
                );
              })}
              {hasData ? (
                <div className="flex items-center gap-3 mt-4 pt-4 px-3 border-t">
                  <Link
                    href="/settings"
                    className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                    onClick={() => setOpen(false)}
                  >
                    <CurrencyLabel currency={displayCurrency} />
                  </Link>
                  <BackupStatusIndicator lastBackupDate={lastBackupDate} />
                </div>
              ) : (
                <Link href="/dashboard" onClick={() => setOpen(false)} className="mt-4">
                  <Button className="w-full" size="lg">
                    <BarChart3 className="h-4 w-4 mr-1" />
                    Începe Acum
                  </Button>
                </Link>
              )}
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="border-t bg-muted/30 mt-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="grid gap-6 md:gap-8 md:grid-cols-3">
          <div>
            <Link href="/" className="flex items-center gap-2 font-bold">
              <TrendingUp className="h-5 w-5 text-primary" />
              WealthTracker RO
            </Link>
            <p className="text-sm text-muted-foreground mt-2">
              Controlează-ți finanțele, 100% privat. Datele tale rămân în browser-ul tău.
            </p>
          </div>
          <div>
            <h4 className="font-medium mb-2">Linkuri</h4>
            <nav className="flex flex-col gap-1.5">
              <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground">
                Dashboard
              </Link>
              <Link href="/recommendations" className="text-sm text-muted-foreground hover:text-foreground">
                Recomandări
              </Link>
              <Link href="/stats" className="text-sm text-muted-foreground hover:text-foreground">
                Statistici Trafic
              </Link>
              <Link href="/settings" className="text-sm text-muted-foreground hover:text-foreground">
                Setări
              </Link>
              <Link href="/privacy" className="text-sm text-muted-foreground hover:text-foreground">
                Confidențialitate
              </Link>
            </nav>
          </div>
          <div>
            <h4 className="font-medium mb-2">Securitate</h4>
            <div className="flex items-start gap-2 text-sm text-muted-foreground">
              <Shield className="h-4 w-4 mt-0.5 text-green-600 shrink-0" />
              <p>
                100% privat. Toate datele sunt stocate local în browser-ul tău folosind IndexedDB.
                Nu colectăm date personale.
              </p>
            </div>
          </div>
        </div>
        <div className="border-t mt-6 pt-4 text-center text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} WealthTracker România. Toate drepturile rezervate.
        </div>
      </div>
    </footer>
  );
}
