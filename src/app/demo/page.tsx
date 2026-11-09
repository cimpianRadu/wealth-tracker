import { buildDashboard } from '@/lib/insights';
import { DEMO_HOUSEHOLD, DEMO_MEMBERS, demoData } from '@/lib/demo';
import { shiftMonth } from '@/lib/model';
import { todayIso } from '@/lib/household';
import { AppNav } from '@/components/AppNav';
import { DashboardView } from '@/components/DashboardView';

export const metadata = { title: 'Demo · Wealth Tracker' };

export default async function DemoPage({ searchParams }: { searchParams: Promise<{ luna?: string }> }) {
  const sp = await searchParams;
  const today = todayIso();
  const last = shiftMonth(today.slice(0, 7), -1);
  const month = /^\d{4}-\d{2}$/.test(sp.luna ?? '') && sp.luna! <= last ? sp.luna! : last;
  const { txs, statements } = demoData(last);
  // În demo, Mihai și-a încărcat extrasele, Ana încă nu: așa se vede și banner-ul de termen.
  const demoStatements = [
    ...statements,
    { id: 's1', period: last, fileName: 'extras-revolut.pdf', bank: 'Revolut', uploadedBy: 'mihai', txCount: 64, skipped: 0, createdAt: today },
  ];
  const dash = buildDashboard({ household: DEMO_HOUSEHOLD, members: DEMO_MEMBERS, txs, statements: demoStatements, month, today });
  return (
    <>
      <AppNav base="/demo" householdName={DEMO_HOUSEHOLD.name} demo />
      <main className="mx-auto max-w-6xl px-4 pb-20 pt-6">
        <p className="mb-6 rounded-xl bg-accent-soft px-4 py-3 text-sm">
          Date inventate pentru o gospodărie de exemplu. În contul vostru, cifrele vin din extrasele pe care le încărcați.
        </p>
        <DashboardView dash={dash} members={DEMO_MEMBERS} base="/demo" today={today} demo />
      </main>
    </>
  );
}
