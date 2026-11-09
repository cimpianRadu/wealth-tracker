'use client';

import { useTransition } from 'react';
import { Trash2 } from 'lucide-react';
import clsx from 'clsx';
import { CATEGORIES, KIND_LABELS, formatMoney, type Kind, type Tx } from '@/lib/model';
import { deleteTransaction, updateTransaction } from '@/lib/actions/household';

export function TxRow({ tx, memberName }: { tx: Tx; memberName: string }) {
  const [pending, start] = useTransition();
  return (
    <tr className={clsx(pending && 'opacity-50', tx.kind !== 'expense' && 'text-muted')}>
      <td className="tabular px-4 py-2 whitespace-nowrap">{tx.date.slice(5).split('-').reverse().join('.')}</td>
      <td className="px-2 py-2">
        <div className="font-medium text-ink">{tx.merchant}</div>
        <div className="text-xs text-muted">
          {memberName}
          {tx.account ? ` · ${tx.account}` : ''}
          {tx.pending ? ' · în așteptare' : ''}
        </div>
      </td>
      <td className="tabular px-2 py-2 text-right whitespace-nowrap">
        <div className="font-semibold text-ink">{formatMoney(tx.amountBase)}</div>
        {tx.currency !== 'RON' && <div className="text-xs text-muted">{formatMoney(tx.amount, tx.currency, 2)}</div>}
      </td>
      <td className="px-2 py-2">
        <select
          className="field py-1 text-sm"
          defaultValue={tx.category}
          onChange={(e) => start(() => updateTransaction(tx.id, { category: e.target.value }))}
          aria-label="Categorie"
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
          defaultValue={tx.kind}
          onChange={(e) => start(() => updateTransaction(tx.id, { kind: e.target.value as Kind }))}
          aria-label="Fel"
        >
          {(Object.keys(KIND_LABELS) as Kind[]).map((k) => (
            <option key={k} value={k}>
              {KIND_LABELS[k]}
            </option>
          ))}
        </select>
      </td>
      <td className="px-2 py-2">
        <button
          onClick={() => {
            if (confirm('Ștergi tranzacția?')) start(() => deleteTransaction(tx.id));
          }}
          className="rounded p-1 text-muted hover:text-bad"
          aria-label="Șterge"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </td>
    </tr>
  );
}
