import { loadMembers, loadStatements, requireMembership, todayIso } from '@/lib/household';
import { computeDue } from '@/lib/insights';
import { dayLabel, monthLabel } from '@/lib/model';
import { deleteStatement } from '@/lib/actions/household';
import { Uploader } from './Uploader';

export const metadata = { title: 'Extrase · Wealth Tracker' };

export default async function StatementsPage() {
  const { household } = await requireMembership();
  const [members, statements] = await Promise.all([loadMembers(household.id), loadStatements(household.id)]);
  const due = computeDue(household, members, statements, todayIso());
  const names = new Map(members.map((m) => [m.userId, m.name]));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl">Extrase</h1>
        <p className="mt-2 max-w-2xl text-muted">
          Termenul pentru {monthLabel(due.period)} e {dayLabel(due.dueDate)}.{' '}
          {due.members.map((m) => `${m.name}: ${m.uploaded ? 'gata' : 'încă nu'}`).join(' · ')}. Tranzacțiile apar într-o
          ciornă pe care o verifici înainte să o salvezi.
        </p>
      </div>

      <Uploader />

      <section>
        <h2 className="font-semibold">Istoric</h2>
        {statements.length ? (
          <ul className="card mt-3 divide-y divide-line">
            {statements.map((s) => (
              <li key={s.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 text-sm">
                <div>
                  <p className="font-medium">{s.fileName}</p>
                  <p className="text-muted">
                    {names.get(s.uploadedBy) ?? 'Membru plecat'} · {s.bank ?? 'bancă necunoscută'} · {monthLabel(s.period)} ·{' '}
                    {s.txCount} tranzacții{s.skipped ? `, ${s.skipped} duplicate sărite` : ''}
                  </p>
                </div>
                <form action={deleteStatement}>
                  <input type="hidden" name="id" value={s.id} />
                  <button className="text-muted underline hover:text-bad">Șterge extrasul și tranzacțiile lui</button>
                </form>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-muted">Niciun extras încărcat încă.</p>
        )}
      </section>
    </div>
  );
}
