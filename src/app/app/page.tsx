import Link from 'next/link';
import { buildDashboard } from '@/lib/insights';
import { loadMembers, loadStatements, loadTransactions, requireMembership, todayIso } from '@/lib/household';
import { shiftMonth } from '@/lib/model';
import { DashboardView } from '@/components/DashboardView';

export const metadata = { title: 'Panou · Wealth Tracker' };

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ luna?: string }> }) {
  const { household } = await requireMembership();
  const sp = await searchParams;
  const today = todayIso();
  // Implicit: luna trecută, pentru că extrasele vin după ce se încheie luna.
  const month = /^\d{4}-\d{2}$/.test(sp.luna ?? '') ? sp.luna! : shiftMonth(today.slice(0, 7), -1);

  const [members, statements, txs] = await Promise.all([
    loadMembers(household.id),
    loadStatements(household.id),
    loadTransactions(household.id, shiftMonth(month, -12), month),
  ]);

  if (!txs.length && !statements.length) {
    return (
      <div className="mx-auto max-w-xl py-16 text-center">
        <h1 className="font-display text-3xl">Încă nu sunt date</h1>
        <p className="mt-3 text-muted">
          Încarcă primul extras de cont (PDF). Tranzacțiile sunt citite și împărțite pe categorii, iar tu le verifici
          înainte să fie salvate.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link href="/app/extrase" className="btn btn-accent">
            Încarcă un extras
          </Link>
          <Link href="/app/setari" className="btn btn-ghost">
            Invită partenerul
          </Link>
        </div>
      </div>
    );
  }

  const dash = buildDashboard({ household, members, txs, statements, month, today });
  return <DashboardView dash={dash} members={members} base="/app" today={today} />;
}
