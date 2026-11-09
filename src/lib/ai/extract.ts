// Citirea unui extras de cont: text din PDF, mascat, trimis la Claude cu un
// tool forțat, ca răspunsul să vină structurat. Rezultatul e o ciornă: omul o
// verifică în /app/extrase înainte de salvare.

import 'server-only';
import { extractText, getDocumentProxy } from 'unpdf';
import { anthropic, EXTRACT_MODEL } from './client';
import { maskStatementText } from '../mask';
import { CATEGORIES, CATEGORY_IDS, toBase, type Kind, type Rates } from '../model';

export interface DraftTx {
  date: string;
  description: string;
  merchant: string;
  account: string;
  amount: number;
  currency: string;
  amountBase: number;
  direction: 'out' | 'in';
  kind: Kind;
  category: string;
  pending: boolean;
}

export interface Draft {
  bank: string;
  period: string;
  transactions: DraftTx[];
}

const KINDS: Kind[] = ['expense', 'income', 'own_transfer', 'fx', 'investment', 'refund'];
const MAX_CHARS = 120_000;

export async function pdfToText(bytes: Uint8Array): Promise<string> {
  const pdf = await getDocumentProxy(bytes);
  const { text } = await extractText(pdf, { mergePages: false });
  return text.map((page, i) => `--- Pagina ${i + 1} ---\n${page}`).join('\n\n');
}

const TOOL = {
  name: 'record_transactions',
  description: 'Salvează tranzacțiile citite din extrasul de cont.',
  input_schema: {
    type: 'object' as const,
    properties: {
      bank: { type: 'string', description: 'Banca sau instituția: BT, Revolut, Revolut Business, ING, Wise etc.' },
      period: { type: 'string', description: 'Luna acoperită de extras, YYYY-MM. Dacă acoperă mai multe, luna de final.' },
      transactions: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            date: { type: 'string', description: 'YYYY-MM-DD. Data tranzacției, nu a decontării (vezi regulile).' },
            description: { type: 'string', description: 'Descrierea scurtă din extras, maxim 120 de caractere.' },
            merchant: { type: 'string', description: 'Numele curat al comerciantului sau al persoanei: „Auchan”, „Netflix”, „Inga Cimpian”.' },
            account: { type: 'string', description: 'Contul, scurt: „BT Visa Gold”, „BT cont curent”, „Revolut RON”, „Revolut Business USD”.' },
            amount: { type: 'number', description: 'Suma, pozitivă, în moneda contului.' },
            currency: { type: 'string', description: 'RON, EUR, USD, GBP etc.' },
            direction: { type: 'string', enum: ['out', 'in'] },
            kind: { type: 'string', enum: KINDS },
            category: { type: 'string', enum: CATEGORY_IDS },
            pending: { type: 'boolean', description: 'true pentru sumele blocate / în așteptare, încă nedecontate.' },
          },
          required: ['date', 'description', 'merchant', 'account', 'amount', 'currency', 'direction', 'kind', 'category', 'pending'],
        },
      },
    },
    required: ['bank', 'period', 'transactions'],
  },
};

function systemPrompt(p: { uploaderNames: string[]; partnerNames: string[]; partnerTransfers: 'expense' | 'internal' }) {
  const cats = CATEGORIES.map((c) => `${c.id} (${c.label})`).join(', ');
  return `Citești extrase de cont românești (BT, Revolut, ING, BCR, Raiffeisen, Wise etc.) și scoți fiecare tranzacție, exact cum apare. Nu inventa tranzacții și nu le combina.

Reguli:
1. Data: la plățile cu cardul, folosește data tranzacției din detalii (ex. „POS 29/09/2026” sau „EPOS 16/10/2026”), nu data la care a fost decontată. Altfel, data rândului.
2. Ignoră rândurile de sold, rulaj, totaluri, „sold anterior”, „sold final”, rezumate și textul juridic.
3. Include și sumele blocate / în așteptare / „sume blocate”, cu pending=true.
4. Comisioanele băncii sunt cheltuieli separate (categoria abonamente dacă e abonament de cont, altfel altele).
5. Un extras poate avea mai multe conturi sau valute: pune la fiecare tranzacție contul și moneda ei.

Fel (kind):
- own_transfer: bani mutați între conturile aceleiași persoane (inclusiv PFA-ul titularului, pocket-uri, vault-uri, economii), plata cardului de credit din contul propriu. Titularul extrasului: ${p.uploaderNames.join(', ') || 'necunoscut'}.
- fx: schimb valutar („Schimbat în”, „Exchange”, „Main · USD –> Main · RON”).
- investment: brokeri și crypto (Trading 212, XTB, Interactive Brokers, Binance, Bitvavo, Revolut Invest).
- income: bani primiți (salariu, clienți, bani de la alte persoane).
- refund: retururi și rambursări de la comercianți.
- expense: orice altă plată ieșită.

Partenerul de viață al titularului: ${p.partnerNames.join(', ') || 'nu e setat'}. Transferurile către partener au category=partener și kind=${p.partnerTransfers === 'internal' ? 'own_transfer' : 'expense'}.
Transferurile către alte persoane fizice: category=familie, kind=expense.
Cheltuielile unui cont de firmă (PFA, SRL, „Business”) care țin de activitate (software, contabilitate, abonamente de business, comisioane): category=pfa.

Categorii posibile: ${cats}.
Tutunul (sume fixe gen 29,50 RON la benzinării, magazine mici sau tutungerii, „tabac”) merge la tutun doar dacă descrierea o arată clar; altfel supermarket sau altele.

Răspunde doar apelând tool-ul record_transactions.`;
}

function clean(raw: unknown, rates: Rates): DraftTx | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const date = String(r.date ?? '');
  const amount = Math.abs(Number(r.amount));
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(amount) || amount === 0) return null;
  const currency = String(r.currency ?? 'RON').toUpperCase().slice(0, 3);
  const kind = KINDS.includes(r.kind as Kind) ? (r.kind as Kind) : 'expense';
  const category = (CATEGORY_IDS as string[]).includes(String(r.category)) ? String(r.category) : 'altele';
  const direction = r.direction === 'in' ? 'in' : 'out';
  const rounded = Math.round(amount * 100) / 100;
  return {
    date,
    description: String(r.description ?? '').slice(0, 200),
    merchant: String(r.merchant ?? r.description ?? '').slice(0, 80) || 'Necunoscut',
    account: String(r.account ?? '').slice(0, 60) || 'Cont',
    amount: rounded,
    currency,
    amountBase: toBase(rounded, currency, rates),
    direction,
    kind: direction === 'in' && kind === 'expense' ? 'income' : kind,
    category,
    pending: r.pending === true,
  };
}

export async function extractStatement(
  text: string,
  ctx: { uploaderNames: string[]; partnerNames: string[]; partnerTransfers: 'expense' | 'internal'; rates: Rates },
): Promise<Draft> {
  const masked = maskStatementText(text).slice(0, MAX_CHARS);
  const stream = anthropic().messages.stream({
    model: EXTRACT_MODEL,
    max_tokens: 32000,
    system: systemPrompt(ctx),
    tools: [TOOL],
    tool_choice: { type: 'tool', name: TOOL.name },
    messages: [{ role: 'user', content: `Extrasul de cont (text extras din PDF):\n\n${masked}` }],
  });
  const message = await stream.finalMessage();
  const block = message.content.find((b) => b.type === 'tool_use');
  if (!block || block.type !== 'tool_use') throw new Error('Modelul nu a întors tranzacții.');
  const input = block.input as { bank?: unknown; period?: unknown; transactions?: unknown };
  const list = Array.isArray(input.transactions) ? input.transactions : [];
  const transactions = list.map((t) => clean(t, ctx.rates)).filter((t): t is DraftTx => t !== null);
  const period = /^\d{4}-\d{2}$/.test(String(input.period)) ? String(input.period) : mostCommonMonth(transactions);
  return { bank: String(input.bank ?? '').slice(0, 40), period, transactions };
}

function mostCommonMonth(txs: DraftTx[]): string {
  const counts = new Map<string, number>();
  for (const t of txs) counts.set(t.date.slice(0, 7), (counts.get(t.date.slice(0, 7)) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? new Date().toISOString().slice(0, 7);
}

/** Validează din nou ciorna venită de la client înainte de salvare. */
export function sanitizeDraft(raw: unknown, rates: Rates): DraftTx[] {
  if (!Array.isArray(raw)) return [];
  return raw.slice(0, 1500).map((t) => clean(t, rates)).filter((t): t is DraftTx => t !== null);
}
