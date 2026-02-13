'use client';

import { useWealthStore } from '@/lib/store';
import type { Currency } from '@/lib/db';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Settings } from 'lucide-react';

export function CurrencySettings() {
  const { displayCurrency, setDisplayCurrency, exchangeRates } = useWealthStore();

  const currencies: Currency[] = ['RON', 'EUR', 'USD'];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Settings className="h-4 w-4" />
          Monedă de Afișare
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm text-muted-foreground mb-2">
            Alege moneda în care vrei să vezi toate valorile din aplicație.
          </p>
          <div className="flex gap-2">
            {currencies.map(c => (
              <Button
                key={c}
                variant={displayCurrency === c ? 'default' : 'outline'}
                size="sm"
                onClick={() => setDisplayCurrency(c)}
              >
                {c === 'RON' ? 'RON (Lei)' : c === 'EUR' ? 'EUR (Euro)' : 'USD (Dollar)'}
              </Button>
            ))}
          </div>
        </div>

        <div className="text-xs text-muted-foreground border-t pt-3 space-y-1">
          <p className="font-medium">Cursuri BNR (actualizate automat):</p>
          <p>1 EUR = {exchangeRates.eurToRon.toFixed(4)} RON</p>
          <p>1 USD = {exchangeRates.usdToRon.toFixed(4)} RON</p>
        </div>
      </CardContent>
    </Card>
  );
}
