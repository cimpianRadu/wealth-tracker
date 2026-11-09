// Calculele din dashboard: totaluri, buget pe membru, recurențe, insights și
// „amintiri”. Funcții pure, fără DB, ca să le folosească și modul demo.

import {
  CATEGORIES,
  OUTSIDE_PERSONAL_BUDGET,
  budgetInBase,
  categoryColor,
  categoryLabel,
  dayLabel,
  formatMoney,
  monthLabel,
  monthOf,
  shiftMonth,
  type CategoryId,
  type Household,
  type Member,
  type StatementRow,
  type Tx,
} from './model';

export interface DashboardInput {
  household: Household;
  members: Member[];
  txs: Tx[];
  statements: StatementRow[];
  month: string; // YYYY-MM afișată
  today: string; // YYYY-MM-DD
}

export interface MemberSummary {
  userId: string;
  name: string;
  personal: number;
  partner: number;
  pfa: number;
  budget: number | null;
  pct: number | null;
}

export interface CategorySummary {
  id: string;
  label: string;
  color: string;
  total: number;
  avg: number;
  count: number;
}

export interface MonthPoint {
  month: string;
  label: string;
  total: number;
  [memberId: string]: string | number;
}

export interface Recurring {
  merchant: string;
  category: string;
  monthly: number;
  months: number;
}

export interface Insight {
  tone: 'up' | 'down' | 'neutral';
  title: string;
  detail: string;
}

export interface Memory {
  id: string;
  kicker: string;
  title: string;
  value: string;
  detail: string;
  theme: number;
}

export interface DueStatus {
  period: string;
  dueDate: string;
  overdue: boolean;
  members: { userId: string; name: string; uploaded: boolean; files: number }[];
}

export interface Dashboard {
  month: string;
  monthsWithData: string[];
  total: number;
  prevTotal: number;
  avg: number;
  avgMonths: number;
  byMember: MemberSummary[];
  byCategory: CategorySummary[];
  series: MonthPoint[];
  topMerchants: { merchant: string; count: number; total: number }[];
  recurring: Recurring[];
  recurringTotal: number;
  insights: Insight[];
  memories: Memory[];
  due: DueStatus;
  largest: Tx | null;
  pendingCount: number;
}

const round = (v: number) => Math.round(v);

export function isExpense(t: Tx): boolean {
  return t.kind === 'expense';
}

export function normalizeMerchant(m: string): string {
  return m
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\d+/g, '')
    .replace(/[^a-z ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function sum(list: Tx[]): number {
  return list.reduce((s, t) => s + t.amountBase, 0);
}

function median(values: number[]): number {
  const s = [...values].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

export function expensesByMonth(txs: Tx[]): Map<string, Tx[]> {
  const map = new Map<string, Tx[]>();
  for (const t of txs) {
    if (!isExpense(t)) continue;
    const m = monthOf(t.date);
    const list = map.get(m);
    if (list) list.push(t);
    else map.set(m, [t]);
  }
  return map;
}

function detectRecurring(byMonth: Map<string, Tx[]>, month: string): Recurring[] {
  const window = [0, 1, 2, 3].map((i) => shiftMonth(month, -i));
  const groups = new Map<string, { name: string; category: string; perMonth: Map<string, number[]> }>();
  for (const m of window) {
    for (const t of byMonth.get(m) ?? []) {
      const key = normalizeMerchant(t.merchant);
      if (!key || t.category === 'partener' || t.category === 'familie') continue;
      let g = groups.get(key);
      if (!g) {
        g = { name: t.merchant, category: t.category, perMonth: new Map() };
        groups.set(key, g);
      }
      const arr = g.perMonth.get(m) ?? [];
      arr.push(t.amountBase);
      g.perMonth.set(m, arr);
    }
  }
  const out: Recurring[] = [];
  for (const g of groups.values()) {
    if (g.perMonth.size < 3) continue;
    const counts = [...g.perMonth.values()].map((a) => a.length);
    if (Math.max(...counts) > 2) continue; // supermarketul de 15 ori pe lună nu e abonament
    const monthly = [...g.perMonth.values()].map((a) => a.reduce((s, v) => s + v, 0));
    const med = median(monthly);
    if (med <= 0) continue;
    const spread = Math.max(...monthly.map((v) => Math.abs(v - med) / med));
    if (spread > 0.3) continue;
    out.push({ merchant: g.name, category: g.category, monthly: med, months: g.perMonth.size });
  }
  return out.sort((a, b) => b.monthly - a.monthly);
}

export function computeDue(household: Household, members: Member[], statements: StatementRow[], today: string): DueStatus {
  const currentMonth = today.slice(0, 7);
  const period = shiftMonth(currentMonth, -1);
  const dueDate = `${currentMonth}-${String(household.dueDay).padStart(2, '0')}`;
  const list = members.map((m) => {
    const files = statements.filter((s) => s.uploadedBy === m.userId && s.period === period).length;
    return { userId: m.userId, name: m.name, uploaded: files > 0, files };
  });
  return { period, dueDate, overdue: today > dueDate && list.some((m) => !m.uploaded), members: list };
}

export function buildDashboard(input: DashboardInput): Dashboard {
  const { household, members, txs, statements, month, today } = input;
  const byMonth = expensesByMonth(txs);
  const monthsWithData = [...byMonth.keys()].sort();
  const current = byMonth.get(month) ?? [];
  const total = sum(current);
  const prevTotal = sum(byMonth.get(shiftMonth(month, -1)) ?? []);

  // Media: până la 6 luni dinainte, doar cele cu date.
  const prevMonths = [1, 2, 3, 4, 5, 6].map((i) => shiftMonth(month, -i)).filter((m) => byMonth.has(m));
  const avg = prevMonths.length ? prevMonths.reduce((s, m) => s + sum(byMonth.get(m)!), 0) / prevMonths.length : 0;

  // Pe membri: cheltuieli proprii, bani pentru partener și PFA separat.
  const byMember: MemberSummary[] = members.map((m) => {
    const mine = current.filter((t) => t.memberId === m.userId);
    const personal = sum(mine.filter((t) => !OUTSIDE_PERSONAL_BUDGET.includes(t.category as CategoryId)));
    const budget = budgetInBase(m, household.rates);
    return {
      userId: m.userId,
      name: m.name,
      personal,
      partner: sum(mine.filter((t) => t.category === 'partener')),
      pfa: sum(mine.filter((t) => t.category === 'pfa')),
      budget,
      pct: budget ? personal / budget : null,
    };
  });

  // Pe categorii, cu media lunilor anterioare.
  const byCategory: CategorySummary[] = CATEGORIES.map((c) => {
    const list = current.filter((t) => t.category === c.id);
    const prevSum = prevMonths.reduce(
      (s, m) => s + sum((byMonth.get(m) ?? []).filter((t) => t.category === c.id)),
      0,
    );
    return {
      id: c.id,
      label: c.label,
      color: c.color,
      total: sum(list),
      avg: prevMonths.length ? prevSum / prevMonths.length : 0,
      count: list.length,
    };
  })
    .filter((c) => c.total > 0 || c.avg > 0)
    .sort((a, b) => b.total - a.total);

  // Ultimele 12 luni, stivuite pe membri.
  const series: MonthPoint[] = Array.from({ length: 12 }, (_, i) => shiftMonth(month, i - 11)).map((m) => {
    const list = byMonth.get(m) ?? [];
    const point: MonthPoint = { month: m, label: monthLabel(m, false).slice(0, 3), total: round(sum(list)) };
    for (const mem of members) point[mem.userId] = round(sum(list.filter((t) => t.memberId === mem.userId)));
    return point;
  });

  const merchantMap = new Map<string, { merchant: string; count: number; total: number }>();
  for (const t of current) {
    if (t.category === 'partener' || t.category === 'familie') continue;
    const key = normalizeMerchant(t.merchant) || t.merchant;
    const e = merchantMap.get(key) ?? { merchant: t.merchant, count: 0, total: 0 };
    e.count += 1;
    e.total += t.amountBase;
    merchantMap.set(key, e);
  }
  const topMerchants = [...merchantMap.values()].sort((a, b) => b.total - a.total).slice(0, 8);

  const recurring = detectRecurring(byMonth, month);
  const recurringTotal = recurring.reduce((s, r) => s + r.monthly, 0);
  const largest = current.filter((t) => t.category !== 'partener').sort((a, b) => b.amountBase - a.amountBase)[0] ?? null;

  const insights = buildInsights({ month, total, avg, avgMonths: prevMonths.length, byCategory, current, recurring, recurringTotal, byMember, largest, today });
  const memories = buildMemories({ month, byMonth, current, monthsWithData, total });
  const due = computeDue(household, members, statements, today);

  return {
    month,
    monthsWithData,
    total,
    prevTotal,
    avg,
    avgMonths: prevMonths.length,
    byMember,
    byCategory,
    series,
    topMerchants,
    recurring,
    recurringTotal,
    insights,
    memories,
    due,
    largest,
    pendingCount: current.filter((t) => t.pending).length,
  };
}

function avgLabel(n: number): string {
  return n === 1 ? 'luna anterioară' : `media ultimelor ${n} luni`;
}

function pct(a: number, b: number): number {
  return b ? Math.round(((a - b) / b) * 100) : 0;
}

function buildInsights(p: {
  month: string;
  total: number;
  avg: number;
  avgMonths: number;
  byCategory: CategorySummary[];
  current: Tx[];
  recurring: Recurring[];
  recurringTotal: number;
  byMember: MemberSummary[];
  largest: Tx | null;
  today: string;
}): Insight[] {
  const out: Insight[] = [];
  const name = monthLabel(p.month, false);
  const Name = name[0].toUpperCase() + name.slice(1);

  if (p.total > 0 && p.avgMonths > 0) {
    const d = pct(p.total, p.avg);
    out.push({
      tone: d > 5 ? 'up' : d < -5 ? 'down' : 'neutral',
      title: `${Name}: ${formatMoney(p.total)}`,
      detail:
        Math.abs(d) <= 5
          ? `Aproape de ${avgLabel(p.avgMonths)} (${formatMoney(p.avg)}).`
          : `Cu ${Math.abs(d)}% ${d > 0 ? 'peste' : 'sub'} ${avgLabel(p.avgMonths)} (${formatMoney(p.avg)}).`,
    });
  }

  // Categoria care a crescut cel mai mult față de medie (minim 300 RON diferență).
  const movers = p.byCategory
    .filter((c) => c.avg > 0 && c.id !== 'partener')
    .map((c) => ({ c, diff: c.total - c.avg }))
    .sort((a, b) => b.diff - a.diff);
  const mentioned = new Set<string>();
  const up = movers[0];
  if (up && up.diff > 300) {
    mentioned.add(up.c.id);
    out.push({
      tone: 'up',
      title: `${up.c.label}: ${formatMoney(up.c.total)}`,
      detail: `Cu ${formatMoney(up.diff)} peste media lunară (${formatMoney(up.c.avg)}).`,
    });
  }
  const down = movers[movers.length - 1];
  if (down && down.diff < -300 && down.c.total > 0) {
    mentioned.add(down.c.id);
    out.push({
      tone: 'down',
      title: `${down.c.label}: ${formatMoney(down.c.total)}`,
      detail: `Cu ${formatMoney(-down.diff)} sub media lunară.`,
    });
  }

  // Plăți mici și dese: cafea, tutun, livrări.
  for (const id of ['cafea', 'tutun', 'restaurante'] as const) {
    const list = p.current.filter((t) => t.category === id);
    if (list.length >= 6 && !mentioned.has(id)) {
      const s = sum(list);
      out.push({
        tone: 'neutral',
        title: `${categoryLabel(id)}: ${list.length} plăți, ${formatMoney(s)}`,
        detail: `La ritmul ăsta, pe un an: aproximativ ${formatMoney(Math.round((s * 12) / 100) * 100)}.`,
      });
    }
  }

  if (p.recurring.length) {
    out.push({
      tone: 'neutral',
      title: `${p.recurring.length} plăți recurente, ~${formatMoney(p.recurringTotal)}/lună`,
      detail: `Cele mai mari: ${p.recurring
        .slice(0, 3)
        .map((r) => `${r.merchant} (${formatMoney(r.monthly)})`)
        .join(', ')}.`,
    });
  }

  for (const m of p.byMember) {
    if (m.pct == null || !m.budget) continue;
    const used = Math.round(m.pct * 100);
    const inProgress = p.today.slice(0, 7) === p.month;
    out.push({
      tone: used > 100 ? 'up' : 'neutral',
      title: `${m.name}: ${used}% din buget`,
      detail: inProgress
        ? `${formatMoney(m.personal)} din ${formatMoney(m.budget)} până pe ${dayLabel(p.today)}.`
        : `${formatMoney(m.personal)} din ${formatMoney(m.budget)}${used > 100 ? `, depășit cu ${formatMoney(m.personal - m.budget)}` : ''}.`,
    });
  }

  if (p.largest) {
    out.push({
      tone: 'neutral',
      title: `Cea mai mare plată: ${formatMoney(p.largest.amountBase)}`,
      detail: `${p.largest.merchant}, ${dayLabel(p.largest.date)} (${categoryLabel(p.largest.category)}).`,
    });
  }
  return out;
}

function buildMemories(p: {
  month: string;
  byMonth: Map<string, Tx[]>;
  current: Tx[];
  monthsWithData: string[];
  total: number;
}): Memory[] {
  const out: Memory[] = [];
  const yearAgo = shiftMonth(p.month, -12);
  const old = p.byMonth.get(yearAgo);
  if (old?.length) {
    const oldTotal = sum(old);
    const cats = new Map<string, number>();
    for (const t of old) cats.set(t.category, (cats.get(t.category) ?? 0) + t.amountBase);
    const topCat = [...cats.entries()].filter(([c]) => c !== 'partener').sort((a, b) => b[1] - a[1])[0];
    const big = [...old].filter((t) => t.category !== 'partener').sort((a, b) => b.amountBase - a.amountBase)[0];
    const d = pct(p.total, oldTotal);
    out.push({
      id: 'year-ago',
      kicker: 'Acum un an',
      title: monthLabel(yearAgo),
      value: formatMoney(oldTotal),
      detail: [
        topCat ? `Cel mai mult s-a dus pe ${categoryLabel(topCat[0]).toLowerCase()}.` : '',
        big ? `Cea mai mare plată: ${big.merchant}, ${formatMoney(big.amountBase)}.` : '',
        p.total ? `Luna asta: ${d >= 0 ? '+' : ''}${d}% față de atunci.` : '',
      ]
        .filter(Boolean)
        .join(' '),
      theme: 0,
    });
  }

  const visits = new Map<string, { name: string; count: number; total: number }>();
  for (const t of p.current) {
    if (t.category === 'partener' || t.category === 'familie' || t.category === 'pfa') continue;
    const key = normalizeMerchant(t.merchant);
    const v = visits.get(key) ?? { name: t.merchant, count: 0, total: 0 };
    v.count += 1;
    v.total += t.amountBase;
    visits.set(key, v);
  }
  const fav = [...visits.values()].sort((a, b) => b.count - a.count)[0];
  if (fav && fav.count >= 3) {
    out.push({
      id: 'favorite',
      kicker: `Locul vostru din ${monthLabel(p.month, false)}`,
      title: fav.name,
      value: `${fav.count} vizite`,
      detail: `${formatMoney(fav.total)} în total, cam ${formatMoney(fav.total / fav.count)} pe vizită.`,
      theme: 1,
    });
  }

  const days = new Map<string, number>();
  for (const t of p.current) {
    if (t.category === 'partener' || t.category === 'familie') continue;
    days.set(t.date, (days.get(t.date) ?? 0) + t.amountBase);
  }
  const bigDay = [...days.entries()].sort((a, b) => b[1] - a[1])[0];
  if (bigDay) {
    const items = p.current.filter((t) => t.date === bigDay[0] && t.category !== 'partener' && t.category !== 'familie');
    out.push({
      id: 'big-day',
      kicker: 'Cea mai scumpă zi',
      title: dayLabel(bigDay[0]),
      value: formatMoney(bigDay[1]),
      detail: `${items.length} ${items.length === 1 ? 'plată' : 'plăți'}: ${items
        .sort((a, b) => b.amountBase - a.amountBase)
        .slice(0, 3)
        .map((t) => t.merchant)
        .join(', ')}.`,
      theme: 2,
    });
  }

  const last12 = p.monthsWithData.filter((m) => m <= p.month && m > shiftMonth(p.month, -12));
  if (last12.length >= 4) {
    const calm = last12.map((m) => ({ m, s: sum(p.byMonth.get(m)!) })).sort((a, b) => a.s - b.s)[0];
    out.push({
      id: 'calm',
      kicker: 'Cea mai liniștită lună din ultimul an',
      title: monthLabel(calm.m),
      value: formatMoney(calm.s),
      detail: calm.m === p.month ? 'Chiar luna asta.' : `Cu ${formatMoney(p.total - calm.s)} mai puțin decât luna asta.`,
      theme: 3,
    });
  }

  if (p.monthsWithData.length >= 2) {
    const first = p.monthsWithData[0];
    const all = p.monthsWithData.reduce((s, m) => s + sum(p.byMonth.get(m)!), 0);
    out.push({
      id: 'since',
      kicker: 'De când țineți evidența',
      title: `Din ${monthLabel(first)}`,
      value: `${p.monthsWithData.length} luni`,
      detail: `${formatMoney(all)} urmăriți, în medie ${formatMoney(all / p.monthsWithData.length)} pe lună.`,
      theme: 4,
    });
  }
  return out;
}

export { categoryColor };
