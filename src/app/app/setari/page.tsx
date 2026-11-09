import { loadMembers, requireMembership } from '@/lib/household';
import { deleteMyAccount, removeMember, updateHousehold, updateMember } from '@/lib/actions/household';
import { InviteButton } from './InviteButton';

export const metadata = { title: 'Setări · Wealth Tracker' };

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="card p-5 md:p-6">
      <h2 className="text-lg font-semibold">{title}</h2>
      {hint && <p className="mt-1 text-sm text-muted">{hint}</p>}
      <div className="mt-5">{children}</div>
    </section>
  );
}

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ nou?: string }> }) {
  const { user, household, role } = await requireMembership();
  const sp = await searchParams;
  const members = await loadMembers(household.id);
  const me = members.find((m) => m.userId === user.id)!;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="font-display text-3xl">Setări</h1>
      {sp.nou && (
        <p className="rounded-xl bg-accent-soft px-4 py-3 text-sm">
          Gospodăria e gata. Pașii următori: invită partenerul, setează-ți bugetul, apoi încarcă primele extrase.
        </p>
      )}

      <Section title="Partenerul" hint="Fiecare membru își încarcă propriile extrase. Amândoi vedeți totul.">
        <ul className="mb-5 divide-y divide-line">
          {members.map((m) => (
            <li key={m.userId} className="flex items-center justify-between py-2 text-sm">
              <span>
                {m.name} {m.role === 'owner' && <span className="text-muted">· administrator</span>}
                {m.userId === user.id && <span className="text-muted"> · tu</span>}
              </span>
              {role === 'owner' && m.userId !== user.id && (
                <form action={removeMember}>
                  <input type="hidden" name="userId" value={m.userId} />
                  <button className="text-muted underline hover:text-bad">Scoate din gospodărie</button>
                </form>
              )}
            </li>
          ))}
        </ul>
        <InviteButton />
      </Section>

      <Section
        title="Profilul tău"
        hint="Numele de pe extras ajută la recunoașterea transferurilor între conturile tale și către partener."
      >
        <form action={updateMember} className="grid gap-4 sm:grid-cols-2">
          <input type="hidden" name="userId" value={me.userId} />
          <label className="text-sm font-medium">
            Nume afișat
            <input name="name" defaultValue={me.name} className="field mt-1" />
          </label>
          <div className="grid grid-cols-[1fr_auto] gap-2">
            <label className="text-sm font-medium">
              Buget personal lunar
              <input
                name="budget"
                inputMode="decimal"
                defaultValue={me.monthlyBudget ?? ''}
                placeholder="ex. 1500"
                className="field tabular mt-1"
              />
            </label>
            <label className="text-sm font-medium">
              Monedă
              <select name="budgetCurrency" defaultValue={me.budgetCurrency} className="field mt-1">
                <option>RON</option>
                <option>EUR</option>
                <option>USD</option>
              </select>
            </label>
          </div>
          <label className="text-sm font-medium sm:col-span-2">
            Cum apari pe extrase (câte unul pe rând)
            <textarea
              name="aliases"
              rows={2}
              defaultValue={me.aliases.join('\n')}
              placeholder={'CIMPIAN RADU GHEORGHE\nCIMPIAN RADU GHEORGHE PFA'}
              className="field mt-1"
            />
          </label>
          <p className="text-sm text-muted sm:col-span-2">
            Bugetul personal nu include banii dați partenerului și cheltuielile PFA. Le vezi separat în panou.
          </p>
          <div>
            <button className="btn">Salvează profilul</button>
          </div>
        </form>
      </Section>

      <Section title="Gospodăria">
        <form action={updateHousehold} className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-medium">
            Nume
            <input name="household" defaultValue={household.name} className="field mt-1" />
          </label>
          <label className="text-sm font-medium">
            Termen pentru extrase (ziua din lună)
            <input name="dueDay" type="number" min={1} max={28} defaultValue={household.dueDay} className="field tabular mt-1" />
            <span className="mt-1 block font-normal text-muted">
              Până pe {household.dueDay} ale lunii, fiecare încarcă extrasele lunii trecute. Primiți reminder pe email cu 2 zile
              înainte și în ziua termenului.
            </span>
          </label>
          <fieldset className="sm:col-span-2">
            <legend className="text-sm font-medium">Curs fix pentru conversia în RON</legend>
            <div className="mt-1 grid grid-cols-3 gap-2">
              {(['USD', 'EUR', 'GBP'] as const).map((c) => (
                <label key={c} className="text-sm text-muted">
                  1 {c} =
                  <input
                    name={c.toLowerCase()}
                    inputMode="decimal"
                    defaultValue={household.rates[c]}
                    className="field tabular mt-1"
                  />
                </label>
              ))}
            </div>
          </fieldset>
          <label className="text-sm font-medium sm:col-span-2">
            Banii trimiși partenerului
            <select name="partnerTransfers" defaultValue={household.partnerTransfers} className="field mt-1">
              <option value="expense">Îi număr la cheltuieli (partenerul nu își încarcă extrasele)</option>
              <option value="internal">Nu îi număr (partenerul își încarcă extrasele, ar fi numărați de două ori)</option>
            </select>
          </label>
          <div>
            <button className="btn">Salvează</button>
          </div>
        </form>
      </Section>

      <Section title="Datele tale" hint="Extrasele PDF nu se păstrează. În baza de date rămân doar tranzacțiile citite din ele.">
        <div className="flex flex-wrap gap-3">
          <a href="/api/export" className="btn btn-ghost">
            Descarcă datele mele (JSON)
          </a>
          <form action="/api/auth/logout" method="post">
            <button className="btn btn-ghost">Ieși din cont</button>
          </form>
        </div>
        <form action={deleteMyAccount} className="mt-6 space-y-2 border-t border-line pt-5">
          <p className="text-sm">
            <strong>Șterge contul.</strong> Pleacă tranzacțiile tale și contul. Dacă ești singur în gospodărie, se șterge toată.
            Nu se poate anula. Scrie STERGE ca să confirmi.
          </p>
          <div className="flex gap-2">
            <input name="confirm" className="field max-w-40" placeholder="STERGE" />
            <button className="btn bg-bad text-white">Șterge contul</button>
          </div>
        </form>
      </Section>
    </div>
  );
}
