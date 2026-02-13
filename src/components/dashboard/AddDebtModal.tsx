'use client';

import { useState, useEffect } from 'react';
import { useWealthStore } from '@/lib/store';
import { convertToRON, DEBT_CATEGORY_LABELS } from '@/lib/currency';
import type { Debt, DebtCategory, Currency } from '@/lib/db';
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

interface AddDebtModalProps {
  open: boolean;
  onClose: () => void;
  debt?: Debt;
}

export function AddDebtModal({ open, onClose, debt }: AddDebtModalProps) {
  const { addDebt, updateDebt, exchangeRates } = useWealthStore();
  const isEditing = !!debt;

  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState<Currency>('RON');
  const [interestRate, setInterestRate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [category, setCategory] = useState<DebtCategory>('personal-loan');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (debt) {
      setName(debt.name);
      setAmount(String(debt.originalAmount));
      setCurrency(debt.currency);
      setInterestRate(debt.interestRate ? String(debt.interestRate) : '');
      setDueDate(debt.dueDate || '');
      setCategory(debt.category as DebtCategory);
      setNotes(debt.notes || '');
    } else {
      setName('');
      setAmount('');
      setCurrency('RON');
      setInterestRate('');
      setDueDate('');
      setCategory('personal-loan');
      setNotes('');
    }
  }, [debt, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const numericAmount = parseFloat(amount);
    if (!name || isNaN(numericAmount)) return;

    const amountRON = convertToRON(numericAmount, currency, exchangeRates);

    if (isEditing && debt?.id) {
      await updateDebt(debt.id, {
        name,
        amountRON,
        currency,
        originalAmount: numericAmount,
        interestRate: interestRate ? parseFloat(interestRate) : undefined,
        dueDate: dueDate || undefined,
        category,
        notes: notes || undefined,
      });
    } else {
      await addDebt({
        name,
        amountRON,
        currency,
        originalAmount: numericAmount,
        interestRate: interestRate ? parseFloat(interestRate) : undefined,
        dueDate: dueDate || undefined,
        category,
        notes: notes || undefined,
      });
    }

    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Editează Datorie' : 'Adaugă Datorie Nouă'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="debt-name">Nume / Descriere</Label>
            <Input
              id="debt-name"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="ex. Credit ipotecar, Card de credit..."
              required
            />
          </div>

          <div>
            <Label htmlFor="debt-category">Categorie</Label>
            <Select value={category} onValueChange={(v) => setCategory(v as DebtCategory)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(DEBT_CATEGORY_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="debt-amount">Sumă</Label>
              <Input
                id="debt-amount"
                type="number"
                step="any"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="0.00"
                required
              />
            </div>
            <div>
              <Label htmlFor="debt-currency">Monedă</Label>
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
            <div>
              <Label htmlFor="interest-rate">Dobândă % (opțional)</Label>
              <Input
                id="interest-rate"
                type="number"
                step="0.01"
                value={interestRate}
                onChange={e => setInterestRate(e.target.value)}
                placeholder="5.5"
              />
            </div>
            <div>
              <Label htmlFor="due-date">Data Scadenței (opțional)</Label>
              <Input
                id="due-date"
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="debt-notes">Note (opțional)</Label>
            <Textarea
              id="debt-notes"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Detalii suplimentare..."
              rows={2}
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={onClose}>
              Anulează
            </Button>
            <Button type="submit">
              {isEditing ? 'Salvează' : 'Adaugă'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
