import type { CategorySummary } from '@/lib/insights';
import { formatMoney } from '@/lib/model';

/** Bare orizontale pe categorii, cu media lunară marcată cu o linie. HTML simplu, fără bibliotecă. */
export function CategoryBars({ categories }: { categories: CategorySummary[] }) {
  const max = Math.max(1, ...categories.map((c) => Math.max(c.total, c.avg)));
  if (!categories.length) return <p className="text-sm text-muted">Nicio cheltuială în luna asta.</p>;
  return (
    <ul className="space-y-3">
      {categories.map((c) => (
        <li key={c.id}>
          <div className="flex items-baseline justify-between gap-2 text-sm">
            <span>{c.label}</span>
            <span className="tabular font-semibold">{formatMoney(c.total)}</span>
          </div>
          <div className="relative mt-1 h-2.5 rounded-full bg-line/60">
            <div className="h-full rounded-full" style={{ width: `${(c.total / max) * 100}%`, background: c.color }} />
            {c.avg > 0 && (
              <div
                className="absolute -top-1 h-4.5 w-0.5 bg-ink/70"
                style={{ left: `${(c.avg / max) * 100}%` }}
                title={`Media: ${formatMoney(c.avg)}`}
              />
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
