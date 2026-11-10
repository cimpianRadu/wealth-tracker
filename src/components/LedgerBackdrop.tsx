// Fundalul din hero: cheltuielile unei case pe categorii, trei luni la rând,
// cu diferența față de luna trecută. E doar decor (aria-hidden); cifrele sunt
// inventate, dar plauzibile.

const MONTHS = ['August', 'Septembrie', 'Octombrie'];

const ROWS: [string, number, number, number][] = [
  ['Supermarket', 2140, 2310, 2480],
  ['Restaurante', 640, 910, 1180],
  ['Livrări mâncare', 210, 340, 465],
  ['Facturi', 820, 790, 860],
  ['Transport', 690, 720, 655],
  ['Abonamente', 245, 245, 312],
  ['Haine', 380, 1120, 410],
  ['Copii', 560, 610, 590],
  ['Cafea', 140, 180, 236],
  ['Sport', 150, 150, 150],
  ['Sănătate', 95, 260, 120],
  ['Cadouri', 0, 180, 350],
];

const fmt = (n: number) => n.toLocaleString('ro-RO');

function delta(prev: number, cur: number) {
  if (prev === 0) return { text: 'nou', up: true };
  const pct = Math.round(((cur - prev) / prev) * 100);
  return { text: `${pct > 0 ? '+' : pct < 0 ? '−' : ''}${Math.abs(pct)}%`, up: pct > 0 };
}

export function LedgerBackdrop() {
  const totals = MONTHS.map((_, i) => ROWS.reduce((s, r) => s + (r[i + 1] as number), 0));
  const totalDelta = delta(totals[1], totals[2]);
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="ledger-plane">
        <table className="tabular w-full text-[15px]">
          <thead>
            <tr className="border-b border-line text-left text-muted">
              <th className="py-2.5 pr-6 font-normal">Categorie</th>
              {MONTHS.map((m) => (
                <th key={m} className="py-2.5 pr-6 text-right font-normal">
                  {m}
                </th>
              ))}
              <th className="py-2.5 text-right font-normal">Față de sept.</th>
            </tr>
          </thead>
          <tbody>
            {ROWS.map(([name, a, b, c]) => {
              const d = delta(b, c);
              return (
                <tr key={name} className="border-b border-line">
                  <td className="py-2.5 pr-6">{name}</td>
                  <td className="py-2.5 pr-6 text-right text-muted">{fmt(a)}</td>
                  <td className="py-2.5 pr-6 text-right text-muted">{fmt(b)}</td>
                  <td className="py-2.5 pr-6 text-right">{fmt(c)}</td>
                  <td className={`py-2.5 text-right ${d.up ? 'text-warn' : 'text-accent'}`}>{d.text}</td>
                </tr>
              );
            })}
            <tr className="font-semibold">
              <td className="py-2.5 pr-6">Total</td>
              {totals.map((t, i) => (
                <td key={i} className="py-2.5 pr-6 text-right">
                  {fmt(t)}
                </td>
              ))}
              <td className={`py-2.5 text-right ${totalDelta.up ? 'text-warn' : 'text-accent'}`}>{totalDelta.text}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
