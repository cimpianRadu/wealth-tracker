'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FileUp, Loader2, Trash2 } from 'lucide-react';
import clsx from 'clsx';
import { CATEGORIES, KIND_LABELS, formatMoney, monthLabel, type Kind } from '@/lib/model';

interface DraftTx {
  date: string;
  description: string;
  merchant: string;
  account: string;
  amount: number;
  currency: string;
  amountBase: number;
  direction: 'out' | 'in';
  kind: Kind;
  category: string;
  pending: boolean;
}

interface Draft {
  fileName: string;
  bank: string;
  period: string;
  transactions: DraftTx[];
}

type Job = { name: string; status: 'reading' | 'ready' | 'saving' | 'saved' | 'error'; draft?: Draft; error?: string; result?: string };

export function Uploader() {
  const input = useRef<HTMLInputElement>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [drag, setDrag] = useState(false);
  const router = useRouter();

  function update(i: number, patch: Partial<Job>) {
    setJobs((list) => list.map((j, k) => (k === i ? { ...j, ...patch } : j)));
  }

  async function handle(files: FileList | File[]) {
    const list = [...files].filter((f) => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf'));
    if (!list.length) return;
    const start = jobs.length;
    setJobs((j) => [...j, ...list.map((f) => ({ name: f.name, status: 'reading' as const }))]);
    // Pe rând, nu în paralel: fiecare citire e un apel AI lung.
    for (let i = 0; i < list.length; i++) {
      const fd = new FormData();
      fd.append('file', list[i]);
      try {
        const res = await fetch('/api/statements/parse', { method: 'POST', body: fd });
        const data = await res.json();
        if (!res.ok) update(start + i, { status: 'error', error: data.error ?? 'Eroare la citire.' });
        else update(start + i, { status: 'ready', draft: data as Draft });
      } catch {
        update(start + i, { status: 'error', error: 'Conexiunea s-a întrerupt.' });
      }
    }
  }

  async function save(i: number) {
    const job = jobs[i];
    if (!job.draft) return;
    update(i, { status: 'saving' });
    const res = await fetch('/api/statements/commit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(job.draft),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      update(i, { status: 'ready', error: data.error ?? 'Salvarea a eșuat.' });
      return;
    }
    update(i, {
      status: 'saved',
      result: `${data.saved} tranzacții salvate${data.skipped ? `, ${data.skipped} existau deja și au fost sărite` : ''}.`,
    });
    router.refresh();
  }

  function editTx(i: number, k: number, patch: Partial<DraftTx>) {
    setJobs((list) =>
      list.map((j, idx) =>
        idx === i && j.draft
          ? { ...j, draft: { ...j.draft, transactions: j.draft.transactions.map((t, x) => (x === k ? { ...t, ...patch } : t)) } }
          : j,
      ),
    );
  }

  function removeTx(i: number, k: number) {
    setJobs((list) =>
      list.map((j, idx) =>
        idx === i && j.draft ? { ...j, draft: { ...j.draft, transactions: j.draft.transactions.filter((_, x) => x !== k) } } : j,
      ),
    );
  }

  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={() => input.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          handle(e.dataTransfer.files);
        }}
        className={clsx(
          'flex w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-12 text-center transition',
          drag ? 'border-accent bg-accent-soft' : 'border-line bg-card hover:border-accent',
        )}
      >
        <FileUp className="h-8 w-8 text-accent" aria-hidden />
        <span className="mt-3 font-semibold">Trage aici extrasele PDF sau apasă să le alegi</span>
        <span className="mt-1 text-sm text-muted">Mai multe deodată, de la orice bancă. Fișierele nu se salvează, doar tranzacțiile.</span>
      </button>
      <input
        ref={input}
        type="file"
        accept="application/pdf,.pdf"
        multiple
        hidden
        onChange={(e) => {
          if (e.target.files) handle(e.target.files);
          e.target.value = '';
        }}
      />

      {jobs.map((job, i) => (
        <div key={i} className="card overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4">
            <div>
              <p className="font-semibold">{job.name}</p>
              {job.draft && (
                <p className="text-sm text-muted">
                  {job.draft.bank || 'Bancă necunoscută'} · {monthLabel(job.draft.period)} · {job.draft.transactions.length} tranzacții ·
                  cheltuieli{' '}
                  {formatMoney(
                    job.draft.transactions.filter((t) => t.kind === 'expense').reduce((s, t) => s + t.amountBase, 0),
                  )}
                </p>
              )}
            </div>
            {job.status === 'reading' && (
              <span className="flex items-center gap-2 text-sm text-muted">
                <Loader2 className="h-4 w-4 animate-spin" /> Citesc extrasul, durează până la un minut…
              </span>
            )}
            {(job.status === 'ready' || job.status === 'saving') && (
              <div className="flex gap-2">
                <button className="btn btn-ghost" onClick={() => setJobs((l) => l.filter((_, k) => k !== i))}>
                  Renunță
                </button>
                <button className="btn btn-accent" disabled={job.status === 'saving'} onClick={() => save(i)}>
                  {job.status === 'saving' ? 'Salvez…' : 'Salvează'}
                </button>
              </div>
            )}
            {job.status === 'saved' && <span className="text-sm font-semibold text-accent">{job.result}</span>}
            {job.status === 'error' && <span className="text-sm text-bad">{job.error}</span>}
          </div>
          {job.error && job.status === 'ready' && <p className="bg-bad-soft px-5 py-2 text-sm text-bad">{job.error}</p>}

          {job.draft && job.status !== 'saved' && (
            <div className="max-h-[520px] overflow-auto">
              <table className="w-full min-w-[680px] text-sm">
                <thead className="sticky top-0 bg-card text-left text-xs uppercase tracking-wider text-muted">
                  <tr>
                    <th className="px-4 py-2">Data</th>
                    <th className="px-2 py-2">Ce</th>
                    <th className="px-2 py-2 text-right">Sumă</th>
                    <th className="px-2 py-2">Categorie</th>
                    <th className="px-2 py-2">Fel</th>
                    <th className="px-2 py-2" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {job.draft.transactions.map((t, k) => (
                    <tr key={k} className={clsx(t.kind !== 'expense' && 'text-muted')}>
                      <td className="tabular px-4 py-2 whitespace-nowrap">{t.date.slice(5).split('-').reverse().join('.')}</td>
                      <td className="px-2 py-2">
                        <div className="font-medium text-ink">{t.merchant}</div>
                        <div className="text-xs text-muted">
                          {t.account}
                          {t.pending && ' · în așteptare'}
                        </div>
                      </td>
                      <td className="tabular px-2 py-2 text-right whitespace-nowrap">
                        {t.direction === 'in' ? '+' : ''}
                        {formatMoney(t.amount, t.currency, 2)}
                      </td>
                      <td className="px-2 py-2">
                        <select
                          className="field py-1 text-sm"
                          value={t.category}
                          onChange={(e) => editTx(i, k, { category: e.target.value })}
                        >
                          {CATEGORIES.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-2 py-2">
                        <select
                          className="field py-1 text-sm"
                          value={t.kind}
                          onChange={(e) => editTx(i, k, { kind: e.target.value as Kind })}
                        >
                          {(Object.keys(KIND_LABELS) as Kind[]).map((kd) => (
                            <option key={kd} value={kd}>
                              {KIND_LABELS[kd]}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-2 py-2">
                        <button onClick={() => removeTx(i, k)} className="rounded p-1 text-muted hover:text-bad" aria-label="Scoate rândul">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
