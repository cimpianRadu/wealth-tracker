// Tipurile și categoriile comune pentru server, client și modul demo.

export type Kind = 'expense' | 'income' | 'own_transfer' | 'fx' | 'investment' | 'refund';
export type Currency = 'RON' | 'EUR' | 'USD' | 'GBP';

export const KIND_LABELS: Record<Kind, string> = {
  expense: 'Cheltuială',
  income: 'Venit',
  own_transfer: 'Transfer între conturile proprii',
  fx: 'Schimb valutar',
  investment: 'Investiție',
  refund: 'Retur / rambursare',
};

export const CATEGORIES = [
  { id: 'supermarket', label: 'Supermarket', color: '#2f6f4f' },
  { id: 'restaurante', label: 'Restaurante și livrări', color: '#c2410c' },
  { id: 'cafea', label: 'Cafea', color: '#92400e' },
  { id: 'haine', label: 'Haine și shopping', color: '#be185d' },
  { id: 'casa', label: 'Casă și electrocasnice', color: '#0f766e' },
  { id: 'facturi', label: 'Facturi și utilități', color: '#1d4ed8' },
  { id: 'abonamente', label: 'Abonamente', color: '#6d28d9' },
  { id: 'transport', label: 'Transport și mașină', color: '#475569' },
  { id: 'sanatate', label: 'Sănătate și farmacie', color: '#dc2626' },
  { id: 'copii', label: 'Copii', color: '#ca8a04' },
  { id: 'sport', label: 'Sport', color: '#16a34a' },
  { id: 'divertisment', label: 'Ieșiri și divertisment', color: '#db2777' },
  { id: 'calatorii', label: 'Călătorii', color: '#0284c7' },
  { id: 'tutun', label: 'Tutun', color: '#78716c' },
  { id: 'cadouri', label: 'Cadouri', color: '#e11d48' },
  { id: 'donatii', label: 'Donații', color: '#65a30d' },
  { id: 'partener', label: 'Bani pentru partener', color: '#9333ea' },
  { id: 'familie', label: 'Transferuri familie și prieteni', color: '#a16207' },
  { id: 'pfa', label: 'PFA / firmă', color: '#334155' },
  { id: 'altele', label: 'Altele', color: '#a8a29e' },
] as const;

export type CategoryId = (typeof CATEGORIES)[number]['id'];
export const CATEGORY_IDS = CATEGORIES.map((c) => c.id) as CategoryId[];

const CAT_MAP = new Map<string, (typeof CATEGORIES)[number]>(CATEGORIES.map((c) => [c.id, c]));
export function categoryLabel(id: string): string {
  return CAT_MAP.get(id)?.label ?? 'Altele';
}
export function categoryColor(id: string): string {
  return CAT_MAP.get(id)?.color ?? '#a8a29e';
}

/** Categoriile care nu intră în bugetul personal al membrului: le arătăm separat. */
export const OUTSIDE_PERSONAL_BUDGET: CategoryId[] = ['pfa', 'partener'];

export interface Tx {
  id: string;
  date: string; // YYYY-MM-DD, data tranzacției (nu a decontării)
  description: string;
  merchant: string;
  amount: number;
  currency: string;
  amountBase: number; // în moneda gospodăriei, la cursul fix din setări
  direction: 'out' | 'in';
  kind: Kind;
  category: string;
  pending: boolean;
  memberId: string;
  account: string | null;
}

export interface Member {
  userId: string;
  name: string;
  role: 'owner' | 'member';
  monthlyBudget: number | null;
  budgetCurrency: string;
  aliases: string[];
}

export interface Rates {
  USD: number;
  EUR: number;
  GBP: number;
}

export interface Household {
  id: string;
  name: string;
  baseCurrency: string;
  rates: Rates;
  dueDay: number;
  partnerTransfers: 'expense' | 'internal';
}

export interface StatementRow {
  id: string;
  period: string;
  fileName: string;
  bank: string | null;
  uploadedBy: string;
  txCount: number;
  skipped: number;
  createdAt: string;
}

export function toBase(amount: number, currency: string, rates: Rates, base = 'RON'): number {
  if (currency === base) return amount;
  const r = rates[currency as keyof Rates];
  return r ? Math.round(amount * r * 100) / 100 : amount;
}

export function budgetInBase(m: Member, rates: Rates): number | null {
  if (m.monthlyBudget == null) return null;
  return toBase(m.monthlyBudget, m.budgetCurrency, rates);
}

const MONTHS = ['ianuarie', 'februarie', 'martie', 'aprilie', 'mai', 'iunie', 'iulie', 'august', 'septembrie', 'octombrie', 'noiembrie', 'decembrie'];

export function monthLabel(ym: string, withYear = true): string {
  const [y, m] = ym.split('-').map(Number);
  return withYear ? `${MONTHS[m - 1]} ${y}` : MONTHS[m - 1];
}

export function shiftMonth(ym: string, delta: number): string {
  const [y, m] = ym.split('-').map(Number);
  const d = new Date(Date.UTC(y, m - 1 + delta, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

export function monthOf(date: string): string {
  return date.slice(0, 7);
}

export function formatMoney(v: number, currency = 'RON', digits = 0): string {
  const n = new Intl.NumberFormat('ro-RO', { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(v);
  return `${n} ${currency}`;
}

export function dayLabel(date: string): string {
  const [, m, d] = date.split('-').map(Number);
  return `${d} ${MONTHS[m - 1]}`;
}
