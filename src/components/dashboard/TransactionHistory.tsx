'use client';

import { useState } from 'react';
import { useWealthStore } from '@/lib/store';
import { formatCurrency } from '@/lib/currency';
import type { TransactionType } from '@/lib/db';

const TYPE_LABELS: Record<TransactionType, string> = {
  buy: 'Cumpărare',
  sell: 'Vânzare',
  borrow: 'Împrumut',
  repay: 'Rambursare',
  create: 'Creare',
  delete: 'Ștergere',
};

const TYPE_COLORS: Record<TransactionType, string> = {
  buy: 'text-green-600',
  sell: 'text-amber-600',
  borrow: 'text-red-600',
  repay: 'text-green-600',
  create: 'text-blue-600',
  delete: 'text-red-600',
};

const AMOUNT_PREFIX: Record<TransactionType, string> = {
  buy: '+',
  sell: '-',
  borrow: '+',
  repay: '-',
  create: '',
  delete: '',
};

interface TransactionHistoryProps {
  entityType: 'asset' | 'debt';
  entityId: number;
}

export function TransactionHistory({ entityType, entityId }: TransactionHistoryProps) {
  const { getEntityTransactions, displayCurrency, displayValue } = useWealthStore();
  const [showAll, setShowAll] = useState(false);

  const allTransactions = getEntityTransactions(entityType, entityId);
  const transactions = showAll ? allTransactions : allTransactions.slice(0, 10);
  const hasMore = allTransactions.length > 10;

  if (allTransactions.length === 0) {
    return (
      <div className="px-3 py-2 text-xs text-muted-foreground">
        Niciun istoric disponibil.
      </div>
    );
  }

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('ro-RO', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  return (
    <div className="px-3 pb-3 space-y-1">
      {transactions.map(tx => (
        <div key={tx.id} className="flex items-center justify-between text-xs py-1 border-b last:border-0">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-muted-foreground shrink-0">{formatDate(tx.date)}</span>
            <span className={`font-medium shrink-0 ${TYPE_COLORS[tx.type]}`}>
              {TYPE_LABELS[tx.type]}
            </span>
            {tx.notes && (
              <span className="text-muted-foreground truncate">{tx.notes}</span>
            )}
          </div>
          <span className={`font-medium shrink-0 ml-2 ${TYPE_COLORS[tx.type]}`}>
            {AMOUNT_PREFIX[tx.type]}{formatCurrency(displayValue(tx.amountRON), displayCurrency)}
          </span>
        </div>
      ))}
      {hasMore && !showAll && (
        <button
          onClick={() => setShowAll(true)}
          className="text-xs text-primary hover:underline pt-1"
        >
          Vezi tot ({allTransactions.length} tranzacții)
        </button>
      )}
    </div>
  );
}
