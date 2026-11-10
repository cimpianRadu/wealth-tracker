import Link from 'next/link';
import { Logo } from '@/components/Logo';
import { LedgerBackdrop } from '@/components/LedgerBackdrop';

const FEATURES = [
  {
    title: 'Cum evoluează, nu doar cât',
    text: 'Fiecare lună e comparată cu lunile dinainte. Vezi pe loc ce a crescut, cu cât, și dacă e o lună proastă sau un obicei nou.',
  },
  {
    title: 'Un asistent care caută economii',
    text: '„Unde am putea tăia luna asta?” sau „Cât am dat pe livrări de la începutul anului?” Răspunde cu sume din tranzacțiile voastre, nu cu sfaturi generale.',
  },
  {
    title: 'Tiparele care trec neobservate',
    text: 'Abonamentele care se plătesc lună de lună, locurile la care reveniți cel mai des, categoriile care urcă încet. Lucruri greu de văzut într-un extras.',
  },
  {
    title: 'Toată casa, la un loc',
    text: 'Îți inviți partenerul cu un link. Fiecare își încarcă extrasele, iar voi vedeți totalul casei și cât a cheltuit fiecare față de bugetul lui.',
  },
];

const STEPS = [
  {
    title: 'Încarci extrasul',
    text: 'PDF-ul din aplicația băncii, o dată pe lună. Merge cu BT, Revolut, ING și alte bănci.',
  },
  {
    title: 'Verifici lista',
    text: 'Plățile apar deja pe categorii. Corectezi ce nu e bine și salvezi.',
  },
  {
    title: 'Vezi evoluția și întrebi',
    text: 'Panoul se actualizează, iar asistentul are acum și luna asta în calcul.',
  },
];

export default function Home() {
  return (
    <>
      <div className="relative">
        <LedgerBackdrop />
        <div className="relative mx-auto max-w-5xl px-4">
          <header className="flex items-center justify-between py-6">
            <Logo />
            <nav className="flex items-center gap-2">
              <Link href="/demo" className="btn btn-ghost hidden bg-paper sm:inline-flex">
                Exemplu
              </Link>
              <Link href="/intra" className="btn">
                Intră în cont
              </Link>
            </nav>
          </header>

          <section className="pb-56 pt-12 md:pb-36 md:pt-28">
            <h1 className="font-display max-w-[28rem] text-4xl leading-[1.1] md:text-[3.25rem]">
              Unde se duc banii casei și unde ați putea economisi
            </h1>
            <p className="mt-6 max-w-md text-lg leading-relaxed text-muted">
              Vezi toate cheltuielile voastre la un loc și cum se schimbă de la o lună la alta. Apoi întrebi asistentul:
              el caută prin tranzacții obiceiurile care vă costă cel mai mult.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/intra" className="btn btn-accent">
                Începe gratuit
              </Link>
              <Link href="/demo" className="btn btn-ghost bg-paper">
                Vezi o lună de exemplu
              </Link>
            </div>
          </section>
        </div>
      </div>

      <main className="mx-auto max-w-5xl px-4 pb-20">
        <section aria-labelledby="ce-vezi" className="border-t border-line pt-12">
          <h2 id="ce-vezi" className="font-display text-2xl">
            Ce vezi după prima lună
          </h2>
          <dl className="mt-8 grid gap-x-12 gap-y-8 md:grid-cols-2">
            {FEATURES.map((f) => (
              <div key={f.title}>
                <dt className="font-semibold">{f.title}</dt>
                <dd className="mt-1.5 leading-relaxed text-muted">{f.text}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section aria-labelledby="cum-merge" className="mt-16 border-t border-line pt-12">
          <h2 id="cum-merge" className="font-display text-2xl">
            Cum merge
          </h2>
          <ol className="mt-8 grid gap-8 md:grid-cols-3">
            {STEPS.map((s, i) => (
              <li key={s.title}>
                <span className="tabular font-display text-3xl text-accent">{i + 1}</span>
                <h3 className="mt-2 font-semibold">{s.title}</h3>
                <p className="mt-1.5 leading-relaxed text-muted">{s.text}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="mt-16 rounded-2xl bg-accent-soft px-6 py-8 md:px-10">
          <h2 className="font-display text-2xl">Datele voastre rămân ale voastre</h2>
          <p className="mt-3 max-w-2xl leading-relaxed">
            Serverele sunt în Frankfurt. PDF-ul nu se păstrează după ce e citit, iar IBAN-ul, numărul cardului și CNP-ul
            sunt ascunse înainte de citire. Poți șterge contul și toate datele oricând, din setări.
          </p>
        </section>

        <footer className="mt-16 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted">
          <span>© {new Date().getFullYear()} Wealth Tracker</span>
          <Link href="/confidentialitate" className="hover:text-ink">
            Confidențialitate
          </Link>
          <a href="mailto:contact@wealthtracker.ro" className="hover:text-ink">
            contact@wealthtracker.ro
          </a>
        </footer>
      </main>
    </>
  );
}
