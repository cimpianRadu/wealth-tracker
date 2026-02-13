import type { Currency } from './db';

// Default exchange rates (approximate, user can override)
export const DEFAULT_RATES = {
  eurToRon: 4.97,
  usdToRon: 4.56,
};

export interface ExchangeRates {
  eurToRon: number;
  usdToRon: number;
}

export function convertToRON(amount: number, currency: Currency, rates: ExchangeRates): number {
  switch (currency) {
    case 'RON':
      return amount;
    case 'EUR':
      return amount * rates.eurToRon;
    case 'USD':
      return amount * rates.usdToRon;
    default:
      return amount;
  }
}

export function convertFromRON(amountRON: number, targetCurrency: Currency, rates: ExchangeRates): number {
  switch (targetCurrency) {
    case 'RON':
      return amountRON;
    case 'EUR':
      return amountRON / rates.eurToRon;
    case 'USD':
      return amountRON / rates.usdToRon;
    default:
      return amountRON;
  }
}

export function formatCurrency(amount: number, currency: Currency): string {
  const formatter = new Intl.NumberFormat('ro-RO', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
  return formatter.format(amount);
}

export function formatNumber(amount: number): string {
  return new Intl.NumberFormat('ro-RO', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

export const CURRENCY_SYMBOLS: Record<Currency, string> = {
  RON: 'lei',
  EUR: '€',
  USD: '$',
};

export const CATEGORY_LABELS: Record<string, string> = {
  stocks: 'Acțiuni/Obligațiuni',
  crypto: 'Crypto',
  cash: 'Cash/Conturi Bancare',
  'real-estate': 'Imobiliare',
  other: 'Altele',
};

export const CATEGORY_COLORS: Record<string, string> = {
  stocks: '#3B82F6',
  crypto: '#F59E0B',
  cash: '#10B981',
  'real-estate': '#8B5CF6',
  other: '#6B7280',
};

export const DEBT_CATEGORY_LABELS: Record<string, string> = {
  mortgage: 'Ipotecă',
  'credit-card': 'Card de Credit',
  'personal-loan': 'Împrumut Personal',
  'car-loan': 'Leasing Auto',
  'student-loan': 'Împrumut Studii',
  other: 'Altele',
};
