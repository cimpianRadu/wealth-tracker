'use client';

import { useState } from 'react';
import { useWealthStore } from '@/lib/store';
import { convertToRON, convertFromRON, formatCurrency } from '@/lib/currency';
import type { Debt, Currency } from '@/lib/db';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface DebtTransactionModalProps {
  open: boolean;
  onClose: () => void;
  debt: Debt;
  type: 'borrow' | 'repay';
}

export function DebtTransactionModal({ open, onClose, debt, type }: DebtTransactionModalProps) {
  const { borrowMore, repayDebt, exchangeRates, displayCurrency, displayValue } = useWealthStore();
  const isBorrow = type === 'borrow';

  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState<Currency>(debt.currency);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const numericAmount = parseFloat(amount);

    if (isNaN(numericAmount) || numericAmount <= 0) {
      setError('Introdu o sumă validă.');
      return;
    }

    const amountRON = convertToRON(numericAmount, currency, exchangeRates);

    if (!isBorrow && amountRON > debt.amountRON) {
      setError('Nu poți rambursa mai mult decât soldul curent.');
      return;
    }

    if (!debt.id) return;

    if (isBorrow) {
      await borrowMore(debt.id, amountRON, currency, numericAmount, notes || undefined, date);
    } else {
      await repayDebt(debt.id, amountRON, currency, numericAmount, notes || undefined, date);
    }

    onClose();
  };

  const handleRepayAll = () => {
    const currentInCurrency = convertFromRON(debt.amountRON, currency, exchangeRates);
    setAmount(String(Math.round(currentInCurrency * 100) / 100));
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isBorrow ? 'Împrumută mai mult' : 'Rambursează'} — {debt.name}
          </DialogTitle>
        </DialogHeader>

        <div className="text-sm text-muted-foreground mb-2">
          <p>Sold curent: <span className="font-medium text-red-600">-{formatCurrency(displayValue(debt.amountRON), displayCurrency)}</span></p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="dtx-amount">Sumă ({currency})</Label>
              <Input
                id="dtx-amount"
                type="number"
                step="any"
                value={amount}
                onChange={e => { setAmount(e.target.value); setError(''); }}
                placeholder="0.00"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="dtx-currency">Monedă</Label>
              <Select value={currency} onValueChange={(v) => setCurrency(v as Currency)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="RON">RON (Lei)</SelectItem>
                  <SelectItem value="EUR">EUR (Euro)</SelectItem>
                  <SelectItem value="USD">USD (Dollar)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="dtx-date">Data</Label>
              <Input
                id="dtx-date"
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="dtx-notes">Note (opțional)</Label>
            <Textarea
              id="dtx-notes"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Detalii despre tranzacție..."
              rows={2}
            />
          </div>

          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}

          <div className="flex gap-2 justify-end">
            {!isBorrow && (
              <Button type="button" variant="outline" onClick={handleRepayAll} className="mr-auto">
                Rambursează tot
              </Button>
            )}
            <Button type="button" variant="outline" onClick={onClose}>
              Anulează
            </Button>
            <Button
              type="submit"
              variant={isBorrow ? 'default' : 'destructive'}
            >
              {isBorrow ? 'Împrumută' : 'Rambursează'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
