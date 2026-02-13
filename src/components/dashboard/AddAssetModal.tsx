'use client';

import { useState, useEffect } from 'react';
import { useWealthStore } from '@/lib/store';
import { convertToRON, CATEGORY_LABELS } from '@/lib/currency';
import type { Asset, AssetCategory, Currency } from '@/lib/db';
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

interface AddAssetModalProps {
  open: boolean;
  onClose: () => void;
  asset?: Asset;
}

export function AddAssetModal({ open, onClose, asset }: AddAssetModalProps) {
  const { addAsset, updateAsset, exchangeRates } = useWealthStore();
  const isEditing = !!asset;

  const [name, setName] = useState('');
  const [category, setCategory] = useState<AssetCategory>('stocks');
  const [amount, setAmount] = useState('1');
  const [value, setValue] = useState('');
  const [currency, setCurrency] = useState<Currency>('RON');
  const [purchaseDate, setPurchaseDate] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (asset) {
      setName(asset.name);
      setCategory(asset.category);
      setAmount(String(asset.amount));
      setValue(String(asset.currency === 'RON' ? asset.valueRON : asset.valueRON / (asset.currency === 'EUR' ? exchangeRates.eurToRon : exchangeRates.usdToRon)));
      setCurrency(asset.currency);
      setPurchaseDate(asset.purchaseDate || '');
      setNotes(asset.notes || '');
    } else {
      setName('');
      setCategory('stocks');
      setAmount('1');
      setValue('');
      setCurrency('RON');
      setPurchaseDate('');
      setNotes('');
    }
  }, [asset, open, exchangeRates]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const numericValue = parseFloat(value);
    const numericAmount = parseFloat(amount);

    if (!name || isNaN(numericValue) || isNaN(numericAmount)) return;

    const valueRON = convertToRON(numericValue, currency, exchangeRates);

    if (isEditing && asset?.id) {
      await updateAsset(asset.id, {
        name,
        category,
        amount: numericAmount,
        valueRON,
        currency,
        purchaseDate: purchaseDate || undefined,
        notes: notes || undefined,
      });
    } else {
      await addAsset({
        name,
        category,
        amount: numericAmount,
        valueRON,
        currency,
        purchaseDate: purchaseDate || undefined,
        notes: notes || undefined,
        isActive: true,
      });
    }

    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Editează Activ' : 'Adaugă Activ Nou'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Nume / Descriere</Label>
            <Input
              id="name"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="ex. Acțiuni Apple, BTC, Cont Economii..."
              required
            />
          </div>

          <div>
            <Label htmlFor="category">Categorie</Label>
            <Select value={category} onValueChange={(v) => setCategory(v as AssetCategory)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="amount">Cantitate</Label>
              <Input
                id="amount"
                type="number"
                step="any"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="1"
                required
              />
            </div>
            <div>
              <Label htmlFor="currency">Monedă</Label>
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

          <div>
            <Label htmlFor="value">Valoare Totală ({currency})</Label>
            <Input
              id="value"
              type="number"
              step="any"
              value={value}
              onChange={e => setValue(e.target.value)}
              placeholder="0.00"
              required
            />
          </div>

          <div>
            <Label htmlFor="purchaseDate">Data Achiziției (opțional)</Label>
            <Input
              id="purchaseDate"
              type="date"
              value={purchaseDate}
              onChange={e => setPurchaseDate(e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="notes">Note (opțional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Orice detalii suplimentare..."
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
