'use client';

import { useState } from 'react';
import { useWealthStore } from '@/lib/store';
import { convertToRON, formatCurrency } from '@/lib/currency';
import type { Asset, Currency } from '@/lib/db';
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

interface AssetTransactionModalProps {
  open: boolean;
  onClose: () => void;
  asset: Asset;
  type: 'buy' | 'sell';
}

export function AssetTransactionModal({ open, onClose, asset, type }: AssetTransactionModalProps) {
  const { buyAsset, sellAsset, exchangeRates, displayCurrency, displayValue } = useWealthStore();
  const isBuy = type === 'buy';

  const [value, setValue] = useState('');
  const [quantity, setQuantity] = useState('');
  const [currency, setCurrency] = useState<Currency>(asset.currency);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const numericValue = parseFloat(value);
    const numericQuantity = quantity ? parseFloat(quantity) : undefined;

    if (isNaN(numericValue) || numericValue <= 0) {
      setError('Introdu o valoare validă.');
      return;
    }

    const valueRON = convertToRON(numericValue, currency, exchangeRates);

    if (!isBuy) {
      if (valueRON > asset.valueRON) {
        setError('Nu poți vinde mai mult decât valoarea curentă.');
        return;
      }
      if (numericQuantity !== undefined && numericQuantity > asset.amount) {
        setError('Nu poți vinde mai mult decât cantitatea curentă.');
        return;
      }
    }

    if (!asset.id) return;

    if (isBuy) {
      await buyAsset(asset.id, valueRON, currency, numericValue, numericQuantity, notes || undefined, date);
    } else {
      await sellAsset(asset.id, valueRON, currency, numericValue, numericQuantity, notes || undefined, date);
    }

    onClose();
  };

  const handleSellAll = () => {
    const currentValueInCurrency = displayCurrency === currency
      ? displayValue(asset.valueRON)
      : asset.valueRON;
    setValue(String(currentValueInCurrency));
    setQuantity(String(asset.amount));
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isBuy ? 'Cumpără' : 'Vinde'} — {asset.name}
          </DialogTitle>
        </DialogHeader>

        <div className="text-sm text-muted-foreground mb-2 space-y-1">
          <p>Valoare curentă: <span className="font-medium text-foreground">{formatCurrency(displayValue(asset.valueRON), displayCurrency)}</span></p>
          {asset.amount !== 1 && (
            <p>Cantitate curentă: <span className="font-medium text-foreground">{asset.amount} unități</span></p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="tx-value">Valoare ({currency})</Label>
              <Input
                id="tx-value"
                type="number"
                step="any"
                value={value}
                onChange={e => { setValue(e.target.value); setError(''); }}
                placeholder="0.00"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="tx-currency">Monedă</Label>
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
              <Label htmlFor="tx-quantity">Cantitate (opțional)</Label>
              <Input
                id="tx-quantity"
                type="number"
                step="any"
                value={quantity}
                onChange={e => { setQuantity(e.target.value); setError(''); }}
                placeholder="0"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="tx-date">Data</Label>
              <Input
                id="tx-date"
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="tx-notes">Note (opțional)</Label>
            <Textarea
              id="tx-notes"
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
            {!isBuy && (
              <Button type="button" variant="outline" onClick={handleSellAll} className="mr-auto">
                Vinde tot
              </Button>
            )}
            <Button type="button" variant="outline" onClick={onClose}>
              Anulează
            </Button>
            <Button
              type="submit"
              variant={isBuy ? 'default' : 'destructive'}
            >
              {isBuy ? 'Cumpără' : 'Vinde'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
