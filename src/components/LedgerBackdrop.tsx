// Fundalul din hero: o lună obișnuită a unei case, ca pe un extras pus la un loc.
// E doar decor (aria-hidden); cifrele sunt inventate, dar plauzibile.

const ROWS: [string, string, string, string, string][] = [
  ['02.10', 'Kaufland', 'Supermarket', 'Ana', '−312,40'],
  ['02.10', 'Enel Energie', 'Facturi', 'Mihai', '−186,00'],
  ['03.10', 'Salariu', 'Venit', 'Mihai', '+9.450,00'],
  ['04.10', 'Mega Image', 'Supermarket', 'Mihai', '−87,15'],
  ['05.10', 'Netflix', 'Abonamente', 'Ana', '−59,99'],
  ['06.10', 'OMV', 'Transport', 'Mihai', '−280,00'],
  ['07.10', 'Farmacia Tei', 'Sănătate', 'Ana', '−64,30'],
  ['08.10', 'Starbucks', 'Cafea', 'Ana', '−23,50'],
  ['09.10', 'Digi', 'Facturi', 'Mihai', '−72,00'],
  ['11.10', 'Lidl', 'Supermarket', 'Ana', '−241,88'],
  ['12.10', 'Bolt', 'Transport', 'Mihai', '−34,70'],
  ['13.10', 'eMAG', 'Casă', 'Ana', '−429,00'],
  ['14.10', 'Retur eMAG', 'Retur', 'Ana', '+129,00'],
  ['15.10', 'Sala Fit', 'Sport', 'Mihai', '−150,00'],
  ['16.10', 'Spotify', 'Abonamente', 'Mihai', '−26,99'],
  ['18.10', 'Profi', 'Supermarket', 'Mihai', '−58,40'],
  ['19.10', 'La Mama', 'Restaurante', 'Ana', '−196,00'],
  ['21.10', 'Glovo', 'Restaurante', 'Mihai', '−88,90'],
];

export function LedgerBackdrop() {
  return (
    <div aria-hidden className="ledger-backdrop pointer-events-none absolute inset-0 overflow-hidden">
      <div className="ledger-plane">
        <table className="tabular w-full text-[15px]">
          <tbody>
            {ROWS.map(([d, m, c, who, amt], i) => (
              <tr key={i} className="border-b border-line">
                <td className="py-2.5 pr-6 text-muted">{d}</td>
                <td className="py-2.5 pr-6">{m}</td>
                <td className="py-2.5 pr-6 text-muted">{c}</td>
                <td className="py-2.5 pr-6 text-muted">{who}</td>
                <td className={`py-2.5 text-right ${amt.startsWith('+') ? 'text-accent' : ''}`}>{amt} lei</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
