'use client';

import { useState } from 'react';
import { useWealthStore } from '@/lib/store';
import type { Currency } from '@/lib/db';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Settings } from 'lucide-react';
import { toast } from 'sonner';

export function CurrencySettings() {
  const { displayCurrency, setDisplayCurrency, exchangeRates, updateExchangeRates } = useWealthStore();
  const [eurRate, setEurRate] = useState(String(exchangeRates.eurToRon));
  const [usdRate, setUsdRate] = useState(String(exchangeRates.usdToRon));

  const currencies: Currency[] = ['RON', 'EUR', 'USD'];

  const handleSaveRates = async () => {
    const eur = parseFloat(eurRate);
    const usd = parseFloat(usdRate);
    if (isNaN(eur) || isNaN(usd)) {
      toast.error('Cursuri invalide.');
      return;
    }
    await updateExchangeRates(eur, usd);
    toast.success('Cursuri de schimb actualizate!');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Settings className="h-4 w-4" />
          Setări Monedă
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label className="text-sm">Afișează în:</Label>
          <div className="flex gap-2 mt-1">
            {currencies.map(c => (
              <Button
                key={c}
                variant={displayCurrency === c ? 'default' : 'outline'}
                size="sm"
                onClick={() => setDisplayCurrency(c)}
              >
                {c}
              </Button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-sm">Cursuri de Schimb</Label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <Label className="text-xs text-muted-foreground">1 EUR =</Label>
              <div className="flex items-center gap-1">
                <Input
                  type="number"
                  step="0.01"
                  value={eurRate}
                  onChange={e => setEurRate(e.target.value)}
                  className="h-8"
                />
                <span className="text-xs text-muted-foreground">RON</span>
              </div>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">1 USD =</Label>
              <div className="flex items-center gap-1">
                <Input
                  type="number"
                  step="0.01"
                  value={usdRate}
                  onChange={e => setUsdRate(e.target.value)}
                  className="h-8"
                />
                <span className="text-xs text-muted-foreground">RON</span>
              </div>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={handleSaveRates} className="w-full">
            Salvează Cursuri
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
