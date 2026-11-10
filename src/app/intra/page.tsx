import Link from 'next/link';
import { Logo } from '@/components/Logo';
import { redirect } from 'next/navigation';
import { currentUser } from '@/lib/auth/session';
import { dbConfigured } from '@/lib/db';
import { safeNext } from '@/lib/auth/codes';
import { LoginForm } from './LoginForm';

export const metadata = { title: 'Intră în cont · Wealth Tracker' };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; eroare?: string }> }) {
  const sp = await searchParams;
  const next = safeNext(sp.next);
  if (dbConfigured() && (await currentUser())) redirect(next);

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-4 py-12">
      <Link href="/" aria-label="Wealth Tracker, prima pagină">
        <Logo />
      </Link>
      <h1 className="font-display mt-8 text-3xl">Intră în cont</h1>
      <p className="mt-2 text-muted">Cu Google sau cu un cod primit pe email. Nu ai nevoie de parolă.</p>
      {sp.eroare === 'google' && (
        <p className="mt-4 rounded-lg bg-bad-soft px-3 py-2 text-sm text-bad">
          Intrarea cu Google nu a mers. Încearcă din nou sau folosește codul pe email.
        </p>
      )}
      {!dbConfigured() ? (
        <p className="mt-6 rounded-lg bg-warn-soft px-3 py-2 text-sm text-warn">
          Aplicația nu e încă legată de baza de date (lipsește DATABASE_URL). Până atunci, vezi{' '}
          <Link href="/demo" className="underline">
            demo-ul
          </Link>
          .
        </p>
      ) : (
        <LoginForm next={next} googleEnabled={!!process.env.GOOGLE_CLIENT_ID} />
      )}
    </main>
  );
}
