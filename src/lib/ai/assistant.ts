// Asistentul: Claude cu câteva tool-uri care interoghează doar tranzacțiile
// gospodăriei utilizatorului. household_id vine din sesiune, nu din model.

import 'server-only';
import type Anthropic from '@anthropic-ai/sdk';
import { anthropic, ASSISTANT_MODEL } from './client';
import { db, isoDate, num, str } from '../db';
import { CATEGORIES, CATEGORY_IDS, categoryLabel, monthLabel, shiftMonth, type Household, type Member } from '../model';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

const KINDS = ['expense', 'income', 'own_transfer', 'fx', 'investment', 'refund'];

const TOOLS: Anthropic.Tool[] = [
  {
    name: 'spending_summary',
    description:
      'Totaluri în RON grupate după categorie, membru, lună sau comerciant, pe un interval de luni. Implicit doar cheltuielile (kind=expense).',
    input_schema: {
      type: 'object',
      properties: {
        group_by: { type: 'string', enum: ['category', 'member', 'month', 'merchant'] },
        from_month: { type: 'string', description: 'YYYY-MM, inclusiv' },
        to_month: { type: 'string', description: 'YYYY-MM, inclusiv' },
        category: { type: 'string', enum: CATEGORY_IDS },
        member: { type: 'string', description: 'Numele afișat al membrului' },
        kind: { type: 'string', enum: KINDS },
        limit: { type: 'integer', description: 'Maximum 50' },
      },
      required: ['group_by', 'from_month', 'to_month'],
    },
  },
  {
    name: 'list_transactions',
    description: 'Tranzacții individuale, filtrate. Pentru detalii, nu pentru totaluri.',
    input_schema: {
      type: 'object',
      properties: {
        from_month: { type: 'string' },
        to_month: { type: 'string' },
        category: { type: 'string', enum: CATEGORY_IDS },
        member: { type: 'string' },
        merchant_contains: { type: 'string' },
        kind: { type: 'string', enum: KINDS },
        min_amount: { type: 'number', description: 'În RON' },
        order_by: { type: 'string', enum: ['date', 'amount'] },
        limit: { type: 'integer', description: 'Maximum 40' },
      },
      required: ['from_month', 'to_month'],
    },
  },
];

type Input = Record<string, unknown>;

function monthRange(from: unknown, to: unknown): [string, string] {
  const f = /^\d{4}-\d{2}$/.test(String(from)) ? String(from) : '2000-01';
  const t = /^\d{4}-\d{2}$/.test(String(to)) ? String(to) : '2100-12';
  return [`${f}-01`, `${shiftMonth(t, 1)}-01`];
}

async function runTool(name: string, input: Input, householdId: string): Promise<unknown> {
  const [from, to] = monthRange(input.from_month, input.to_month);
  const params: unknown[] = [householdId, from, to];
  const where = ['t.household_id = $1', 't.tx_date >= $2', 't.tx_date < $3'];
  const kind = KINDS.includes(String(input.kind)) ? String(input.kind) : name === 'spending_summary' ? 'expense' : null;
  if (kind) {
    params.push(kind);
    where.push(`t.kind = $${params.length}`);
  }
  if (input.category && (CATEGORY_IDS as string[]).includes(String(input.category))) {
    params.push(String(input.category));
    where.push(`t.category = $${params.length}`);
  }
  if (typeof input.member === 'string' && input.member.trim()) {
    params.push(input.member.trim());
    where.push(`lower(m.display_name) = lower($${params.length})`);
  }

  if (name === 'spending_summary') {
    const groups: Record<string, string> = {
      category: 't.category',
      member: 'm.display_name',
      month: "to_char(t.tx_date, 'YYYY-MM')",
      merchant: 't.merchant',
    };
    const g = groups[String(input.group_by)] ?? groups.category;
    const limit = Math.min(50, Math.max(1, Number(input.limit) || 25));
    const order = input.group_by === 'month' ? 'key ASC' : 'total DESC';
    const rows = await db().query(
      `SELECT ${g} AS key, round(sum(t.amount_base))::int AS total, count(*)::int AS n
       FROM transactions t JOIN household_members m ON m.household_id = t.household_id AND m.user_id = t.member_id
       WHERE ${where.join(' AND ')} GROUP BY 1 ORDER BY ${order} LIMIT ${limit}`,
      params,
    );
    return rows.map((r) => ({
      [String(input.group_by)]: input.group_by === 'category' ? categoryLabel(str(r.key)) : str(r.key),
      total_ron: num(r.total),
      tranzactii: num(r.n),
    }));
  }

  if (name === 'list_transactions') {
    if (typeof input.merchant_contains === 'string' && input.merchant_contains.trim()) {
      params.push(`%${input.merchant_contains.trim()}%`);
      where.push(`(t.merchant ILIKE $${params.length} OR t.description ILIKE $${params.length})`);
    }
    if (Number(input.min_amount) > 0) {
      params.push(Number(input.min_amount));
      where.push(`t.amount_base >= $${params.length}`);
    }
    const limit = Math.min(40, Math.max(1, Number(input.limit) || 20));
    const order = input.order_by === 'amount' ? 't.amount_base DESC' : 't.tx_date DESC';
    const rows = await db().query(
      `SELECT t.tx_date, t.merchant, t.amount, t.currency, t.amount_base, t.category, t.kind, t.pending, m.display_name
       FROM transactions t JOIN household_members m ON m.household_id = t.household_id AND m.user_id = t.member_id
       WHERE ${where.join(' AND ')} ORDER BY ${order} LIMIT ${limit}`,
      params,
    );
    return rows.map((r) => ({
      data: isoDate(r.tx_date),
      ce: str(r.merchant),
      suma: `${num(r.amount)} ${str(r.currency)}`,
      ron: num(r.amount_base),
      categorie: categoryLabel(str(r.category)),
      fel: str(r.kind),
      membru: str(r.display_name),
      in_asteptare: r.pending === true,
    }));
  }
  return { error: 'tool necunoscut' };
}

async function overview(householdId: string): Promise<string> {
  const rows = await db()`
    SELECT to_char(tx_date, 'YYYY-MM') AS month, round(sum(amount_base))::int AS total
    FROM transactions WHERE household_id = ${householdId} AND kind = 'expense'
    GROUP BY 1 ORDER BY 1 DESC LIMIT 12
  `;
  return rows.map((r) => `${monthLabel(str(r.month))}: ${num(r.total)} RON`).join('; ') || 'nicio lună încă';
}

function systemPrompt(p: { household: Household; members: Member[]; userName: string; today: string; months: string }) {
  const members = p.members
    .map((m) => `${m.name}${m.monthlyBudget != null ? ` (buget personal ${m.monthlyBudget} ${m.budgetCurrency}/lună)` : ''}`)
    .join(', ');
  return `Ești asistentul financiar al gospodăriei „${p.household.name}” pe wealthtracker.ro. Vorbești cu ${p.userName}. Azi e ${p.today}.

Membri: ${members}.
Totaluri lunare de cheltuieli (RON): ${p.months}.
Categorii: ${CATEGORIES.map((c) => `${c.id} = ${c.label}`).join('; ')}.
Bugetul personal al unui membru nu include categoriile partener (bani dați partenerului) și pfa (costuri de firmă).
Sumele sunt în RON, convertite la cursul fix din setări (USD ${p.household.rates.USD}, EUR ${p.household.rates.EUR}).

Cum răspunzi:
- În română, scurt și direct. Cifrele vin doar din tool-uri; dacă datele lipsesc, spune că nu le ai, nu ghici.
- Folosește tool-urile pentru orice cifră. Pentru întrebări gen „cât cheltuim pe supermarket”, ia ultimele luni cu date și dă și media lunară.
- La „unde putem economisi” sau întrebări despre obiceiuri: compară ultimele 3 luni cu lunile dinainte pe categorii (group_by month și category), uită-te la comercianții la care se revine des (group_by merchant) și la plățile care se repetă lunar. Alege 2-3 locuri concrete, cu suma lunară de acum și cât ar însemna pe un an o reducere realistă. Nu propune tăieri la facturi, sănătate sau copii decât dacă ți se cere.
- Când dai sfaturi sau estimări, spune că sunt opinii. Nu ești consultant financiar autorizat și nu recomanzi investiții anume.
- Fără liniuțe lungi (em dash). Liste doar când compari mai multe lucruri.`;
}

export async function askAssistant(p: {
  household: Household;
  members: Member[];
  userName: string;
  today: string;
  messages: ChatMessage[];
}): Promise<string> {
  const system = systemPrompt({ ...p, months: await overview(p.household.id) });
  const messages: Anthropic.MessageParam[] = p.messages.map((m) => ({ role: m.role, content: m.content }));

  for (let round = 0; round < 6; round++) {
    const res = await anthropic().messages.create({
      model: ASSISTANT_MODEL,
      max_tokens: 2000,
      system,
      tools: TOOLS,
      messages,
    });
    if (res.stop_reason !== 'tool_use') {
      return res.content
        .filter((b): b is Anthropic.TextBlock => b.type === 'text')
        .map((b) => b.text)
        .join('\n')
        .trim();
    }
    messages.push({ role: 'assistant', content: res.content });
    const results: Anthropic.ToolResultBlockParam[] = [];
    for (const block of res.content) {
      if (block.type !== 'tool_use') continue;
      try {
        const out = await runTool(block.name, block.input as Input, p.household.id);
        results.push({ type: 'tool_result', tool_use_id: block.id, content: JSON.stringify(out) });
      } catch (err) {
        console.error('[asistent] tool:', err);
        results.push({ type: 'tool_result', tool_use_id: block.id, content: 'Eroare la interogare.', is_error: true });
      }
    }
    messages.push({ role: 'user', content: results });
  }
  return 'Întrebarea a cerut prea mulți pași. Încearcă să o împarți în întrebări mai mici.';
}
