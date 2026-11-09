import Link from 'next/link';
import { ArrowDownRight, ArrowUpRight, ChevronLeft, ChevronRight, Minus, Upload } from 'lucide-react';
import clsx from 'clsx';
import type { Dashboard } from '@/lib/insights';
import { categoryLabel, dayLabel, formatMoney, monthLabel, shiftMonth, type Member } from '@/lib/model';
import { MonthlyChart } from './charts/MonthlyChart';
import { MEMBER_COLORS } from '@/lib/colors';
import { CategoryBars } from './charts/CategoryBars';
import { Memories } from './Memories';

function Delta({ value, base }: { value: number; base: number }) {
  if (!base) return null;
  const d = Math.round(((value - base) / base) * 100);
  const Icon = d > 3 ? ArrowUpRight : d < -3 ? ArrowDownRight : Minus;
  return (
    <span className={clsx('inline-flex items-center gap-1 text-sm', d > 3 ? 'text-bad' : d < -3 ? 'text-accent' : 'text-muted')}>
      <Icon className="h-4 w-4" aria-hidden />
      {d > 0 ? '+' : ''}
      {d}% față de medie
    </span>
  );
}

export function DashboardView({
  dash,
  members,
  base,
  today,
  demo = false,
}: {
  dash: Dashboard;
  members: Member[];
  base: string;
  today: string;
  demo?: boolean;
}) {
  const month = dash.month;
  const Name = monthLabel(month);
  const canNext = month < today.slice(0, 7);

  return (
    <div className="space-y-8">
      {/* Antet: luna și totalul */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-1">
            <Link href={`${base}?luna=${shiftMonth(month, -1)}`} className="rounded-lg p-1.5 hover:bg-line" aria-label="Luna anterioară">
              <ChevronLeft className="h-5 w-5" />
            </Link>
            <h1 className="font-display text-3xl capitalize">{Name}</h1>
            {canNext && (
              <Link href={`${base}?luna=${shiftMonth(month, 1)}`} className="rounded-lg p-1.5 hover:bg-line" aria-label="Luna următoare">
                <ChevronRight className="h-5 w-5" />
              </Link>
            )}
          </div>
          <p className="tabular mt-2 text-4xl font-semibold">{formatMoney(dash.total)}</p>
          <div className="mt-1 flex flex-wrap items-center gap-3">
            <Delta value={dash.total} base={dash.avg} />
            {dash.pendingCount > 0 && (
              <span className="text-sm text-muted">
                {dash.pendingCount === 1 ? '1 plată încă' : `${dash.pendingCount} plăți încă`} în așteptare la bancă
              </span>
            )}
          </div>
        </div>
        {!demo && (
          <Link href="/app/extrase" className="btn">
            <Upload className="h-4 w-4" aria-hidden /> Încarcă extrase
          </Link>
        )}
      </div>

      {/* Termenul pentru extrase */}
      <DueBanner dash={dash} demo={demo} />

      <Memories memories={dash.memories} />

      {/* Pe membri și bugete */}
      <section className="grid gap-4 md:grid-cols-2">
        {dash.byMember.map((m, i) => (
          <div key={m.userId} className="card p-5">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full" style={{ background: MEMBER_COLORS[i % MEMBER_COLORS.length] }} />
              <h2 className="font-semibold">{m.name}</h2>
            </div>
            <p className="tabular mt-3 text-2xl font-semibold">{formatMoney(m.personal)}</p>
            {m.budget != null ? (
              <>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-line">
                  <div
                    className={clsx('h-full rounded-full', (m.pct ?? 0) > 1 ? 'bg-bad' : (m.pct ?? 0) > 0.85 ? 'bg-warn' : 'bg-accent')}
                    style={{ width: `${Math.min(100, (m.pct ?? 0) * 100)}%` }}
                  />
                </div>
                <p className="mt-2 text-sm text-muted">
                  {Math.round((m.pct ?? 0) * 100)}% din bugetul de {formatMoney(m.budget)}
                </p>
              </>
            ) : (
              <p className="mt-2 text-sm text-muted">Fără buget setat.</p>
            )}
            {(m.partner > 0 || m.pfa > 0) && (
              <dl className="mt-4 grid grid-cols-2 gap-2 border-t border-line pt-3 text-sm">
                {m.partner > 0 && (
                  <div>
                    <dt className="text-muted">Bani pentru partener</dt>
                    <dd className="tabular font-semibold">{formatMoney(m.partner)}</dd>
                  </div>
                )}
                {m.pfa > 0 && (
                  <div>
                    <dt className="text-muted">PFA / firmă</dt>
                    <dd className="tabular font-semibold">{formatMoney(m.pfa)}</dd>
                  </div>
                )}
              </dl>
            )}
          </div>
        ))}
      </section>

      {/* Grafice */}
      <section className="grid gap-4 lg:grid-cols-5">
        <div className="card p-5 lg:col-span-3">
          <h2 className="font-semibold">Ultimele 12 luni</h2>
          <p className="text-sm text-muted">Cheltuieli pe membri. Luna aleasă e evidențiată.</p>
          <div className="mt-4">
            <MonthlyChart series={dash.series} members={members} selected={month} />
          </div>
          <div className="mt-2 flex gap-4 text-sm">
            {members.map((m, i) => (
              <span key={m.userId} className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm" style={{ background: MEMBER_COLORS[i % MEMBER_COLORS.length] }} />
                {m.name}
              </span>
            ))}
          </div>
        </div>
        <div className="card p-5 lg:col-span-2">
          <h2 className="font-semibold">Pe categorii</h2>
          <p className="text-sm text-muted">Linia neagră e media lunilor anterioare.</p>
          <div className="mt-4">
            <CategoryBars categories={dash.byCategory.slice(0, 10)} />
          </div>
        </div>
      </section>

      {/* Insights */}
      {dash.insights.length > 0 && (
        <section>
          <h2 className="font-display text-2xl">Ce se vede luna asta</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {dash.insights.map((ins, i) => (
              <div
                key={i}
                className={clsx(
                  'rounded-2xl border p-4',
                  ins.tone === 'up' ? 'border-bad/30 bg-bad-soft' : ins.tone === 'down' ? 'border-accent/30 bg-accent-soft' : 'card',
                )}
              >
                <p className="font-semibold">{ins.title}</p>
                <p className="mt-1 text-sm text-muted">{ins.detail}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Recurente și locuri */}
      <section className="grid gap-4 md:grid-cols-2">
        <div className="card p-5">
          <h2 className="font-semibold">Plăți recurente</h2>
          <p className="text-sm text-muted">Aceeași firmă, sumă apropiată, cel puțin 3 din ultimele 4 luni.</p>
          {dash.recurring.length ? (
            <ul className="mt-4 divide-y divide-line">
              {dash.recurring.map((r) => (
                <li key={r.merchant} className="flex items-center justify-between gap-3 py-2 text-sm">
                  <span>
                    {r.merchant} <span className="text-muted">· {categoryLabel(r.category)}</span>
                  </span>
                  <span className="tabular font-semibold">{formatMoney(r.monthly)}/lună</span>
                </li>
              ))}
              <li className="flex justify-between py-2 text-sm font-semibold">
                <span>Total</span>
                <span className="tabular">{formatMoney(dash.recurringTotal)}/lună</span>
              </li>
            </ul>
          ) : (
            <p className="mt-4 text-sm text-muted">Apar după ce aveți cel puțin 3 luni încărcate.</p>
          )}
        </div>
        <div className="card p-5">
          <h2 className="font-semibold">Unde s-au dus cei mai mulți bani</h2>
          <ul className="mt-4 divide-y divide-line">
            {dash.topMerchants.map((t) => (
              <li key={t.merchant} className="flex items-center justify-between gap-3 py-2 text-sm">
                <span>
                  {t.merchant} <span className="text-muted">· {t.count}×</span>
                </span>
                <span className="tabular font-semibold">{formatMoney(t.total)}</span>
              </li>
            ))}
          </ul>
          {dash.largest && (
            <p className="mt-3 text-sm text-muted">
              Cea mai mare plată: {dash.largest.merchant}, {formatMoney(dash.largest.amountBase)} pe {dayLabel(dash.largest.date)}.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}

function DueBanner({ dash, demo }: { dash: Dashboard; demo: boolean }) {
  const { due } = dash;
  if (!due.members.length) return null;
  const missing = due.members.filter((m) => !m.uploaded);
  if (!missing.length) return null;
  return (
    <div className={clsx('rounded-2xl border px-4 py-3 text-sm', due.overdue ? 'border-bad/30 bg-bad-soft' : 'border-warn/30 bg-warn-soft')}>
      <p className="font-semibold">
        Extrasele pe {monthLabel(due.period)}: termen {dayLabel(due.dueDate)}
        {due.overdue ? ', depășit' : ''}
      </p>
      <p className="mt-1 text-muted">
        {due.members.map((m) => `${m.name} ${m.uploaded ? `✓ (${m.files} ${m.files === 1 ? 'fișier' : 'fișiere'})` : 'încă nu'}`).join(' · ')}
        {!demo && (
          <>
            {' · '}
            <Link href="/app/extrase" className="font-semibold text-ink underline">
              Încarcă acum
            </Link>
          </>
        )}
      </p>
    </div>
  );
}
