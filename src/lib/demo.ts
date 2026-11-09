// Date sintetice pentru /demo: o gospodărie inventată, 14 luni de cheltuieli.
// Fără nicio legătură cu date reale. Generatorul e determinist (seed fix),
// ca pagina să arate la fel la fiecare încărcare.

import { toBase, type Household, type Member, type StatementRow, type Tx } from './model';

function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0x100000000;
  };
}

export const DEMO_HOUSEHOLD: Household = {
  id: 'demo',
  name: 'Ana și Mihai',
  baseCurrency: 'RON',
  rates: { USD: 4.8, EUR: 5.1, GBP: 6.0 },
  dueDay: 5,
  partnerTransfers: 'expense',
};

export const DEMO_MEMBERS: Member[] = [
  { userId: 'mihai', name: 'Mihai', role: 'owner', monthlyBudget: 1500, budgetCurrency: 'USD', aliases: ['MIHAI POPESCU'] },
  { userId: 'ana', name: 'Ana', role: 'member', monthlyBudget: 6000, budgetCurrency: 'RON', aliases: ['ANA POPESCU'] },
];

type Pattern = {
  merchant: string;
  category: string;
  member: string | 'any';
  perMonth: [number, number];
  amount: [number, number];
  currency?: string;
  fixedDay?: number;
};

const PATTERNS: Pattern[] = [
  { merchant: 'Auchan', category: 'supermarket', member: 'any', perMonth: [8, 13], amount: [80, 520] },
  { merchant: 'Lidl', category: 'supermarket', member: 'any', perMonth: [3, 6], amount: [60, 260] },
  { merchant: 'Mega Image', category: 'supermarket', member: 'any', perMonth: [2, 5], amount: [20, 140] },
  { merchant: 'Glovo', category: 'restaurante', member: 'any', perMonth: [2, 6], amount: [70, 190] },
  { merchant: 'Bistro Central', category: 'restaurante', member: 'any', perMonth: [1, 3], amount: [140, 420] },
  { merchant: 'Ukyo Coffee', category: 'cafea', member: 'mihai', perMonth: [4, 9], amount: [16, 38] },
  { merchant: 'Zara', category: 'haine', member: 'ana', perMonth: [0, 2], amount: [120, 480] },
  { merchant: 'Fashion Days', category: 'haine', member: 'ana', perMonth: [0, 2], amount: [150, 520] },
  { merchant: 'Farmacia Tei', category: 'sanatate', member: 'any', perMonth: [1, 3], amount: [30, 260] },
  { merchant: 'Bebetei', category: 'copii', member: 'ana', perMonth: [1, 3], amount: [45, 320] },
  { merchant: 'Bolt', category: 'transport', member: 'any', perMonth: [2, 6], amount: [17, 60] },
  { merchant: 'OMV', category: 'transport', member: 'mihai', perMonth: [2, 3], amount: [250, 380] },
  { merchant: 'Netflix', category: 'abonamente', member: 'mihai', perMonth: [1, 1], amount: [96, 96], fixedDay: 4 },
  { merchant: 'Spotify', category: 'abonamente', member: 'ana', perMonth: [1, 1], amount: [30, 30], fixedDay: 11 },
  { merchant: 'World Class', category: 'sport', member: 'mihai', perMonth: [1, 1], amount: [299, 299], fixedDay: 12 },
  { merchant: 'Digi', category: 'facturi', member: 'ana', perMonth: [1, 1], amount: [69, 69], fixedDay: 2 },
  { merchant: 'Electrica', category: 'facturi', member: 'ana', perMonth: [1, 1], amount: [210, 390], fixedDay: 15 },
  { merchant: 'Anthropic', category: 'pfa', member: 'mihai', perMonth: [1, 1], amount: [90, 90], currency: 'EUR', fixedDay: 28 },
  { merchant: 'Contabilitate SRL', category: 'pfa', member: 'mihai', perMonth: [1, 1], amount: [484, 484], fixedDay: 6 },
  { merchant: 'Transfer către Ana', category: 'partener', member: 'mihai', perMonth: [1, 1], amount: [1800, 1800], currency: 'USD', fixedDay: 13 },
];

export function demoData(month: string): { txs: Tx[]; statements: StatementRow[] } {
  const rand = rng(20261109);
  const txs: Tx[] = [];
  const [y, m] = month.split('-').map(Number);
  let id = 0;
  for (let back = 13; back >= 0; back--) {
    const d = new Date(Date.UTC(y, m - 1 - back, 1));
    const yy = d.getUTCFullYear();
    const mm = d.getUTCMonth() + 1;
    const days = new Date(Date.UTC(yy, mm, 0)).getUTCDate();
    // Decembrie și vara costă mai mult, ca graficul să nu fie plat.
    const season = mm === 12 ? 1.35 : mm === 7 || mm === 8 ? 1.15 : 1;
    for (const p of PATTERNS) {
      const n = p.perMonth[0] + Math.floor(rand() * (p.perMonth[1] - p.perMonth[0] + 1));
      for (let i = 0; i < n; i++) {
        const day = p.fixedDay ?? 1 + Math.floor(rand() * days);
        const raw = p.amount[0] + rand() * (p.amount[1] - p.amount[0]);
        const amount = Math.round((p.fixedDay ? raw : raw * season) * 100) / 100;
        const currency = p.currency ?? 'RON';
        const memberId = p.member === 'any' ? (rand() < 0.55 ? 'ana' : 'mihai') : p.member;
        txs.push({
          id: `d${id++}`,
          date: `${yy}-${String(mm).padStart(2, '0')}-${String(Math.min(day, days)).padStart(2, '0')}`,
          description: p.merchant,
          merchant: p.merchant,
          amount,
          currency,
          amountBase: toBase(amount, currency, DEMO_HOUSEHOLD.rates),
          direction: 'out',
          kind: 'expense',
          category: p.category,
          pending: false,
          memberId,
          account: memberId === 'ana' ? 'BT Ana' : 'Revolut Mihai',
        });
      }
    }
    if (mm === 12) {
      txs.push({
        id: `d${id++}`, date: `${yy}-12-18`, description: 'Cadouri Crăciun', merchant: 'eMAG', amount: 1450, currency: 'RON',
        amountBase: 1450, direction: 'out', kind: 'expense', category: 'cadouri', pending: false, memberId: 'mihai', account: 'Revolut Mihai',
      });
    }
  }
  const statements: StatementRow[] = [];
  return { txs: txs.sort((a, b) => (a.date < b.date ? 1 : -1)), statements };
}
