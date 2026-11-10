import Link from 'next/link';
import { Logo } from '@/components/Logo';
import { LedgerBackdrop } from '@/components/LedgerBackdrop';

const STEPS = [
  {
    title: 'Încarci extrasul',
    text: 'PDF-ul descărcat din aplicația băncii, o dată pe lună. Merge cu BT, Revolut, ING și alte bănci.',
  },
  {
    title: 'Verifici lista',
    text: 'Fiecare plată apare cu data, suma și categoria. Corectezi ce nu e bine și abia apoi salvezi.',
  },
  {
    title: 'Vezi unde s-au dus banii',
    text: 'Totalul casei pe luna asta, comparat cu lunile trecute, și cât a cheltuit fiecare dintre voi.',
  },
];

const FEATURES = [
  {
    title: 'Un buget pentru amândoi',
    text: 'Îți inviți partenerul cu un link. Fiecare își încarcă extrasele lui, iar cifrele se adună într-un singur loc.',
  },
  {
    title: 'Abonamentele, la vedere',
    text: 'Plățile care se repetă în fiecare lună apar separat, ca să vezi ușor ce mai folosești și ce nu.',
  },
  {
    title: 'Întrebi și primești cifra',
    text: '„Cât am dat pe supermarket în ultimele trei luni?” Răspunsul vine din tranzacțiile voastre, cu suma exactă.',
  },
  {
    title: 'Un an mai târziu',
    text: 'Din când în când îți arată cum arăta aceeași lună anul trecut: unde ați mâncat, ce ați plătit, cât a costat.',
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
              <Link href="/demo" className="btn btn-ghost bg-paper hidden sm:inline-flex">
                Exemplu
              </Link>
              <Link href="/intra" className="btn">
                Intră în cont
              </Link>
            </nav>
          </header>

          <section className="pb-56 pt-12 md:pb-36 md:pt-28">
            <h1 className="font-display max-w-xl text-4xl leading-[1.1] md:text-6xl">Unde s-au dus banii luna asta?</h1>
            <p className="mt-6 max-w-md text-lg leading-relaxed text-muted">
              Încarci extrasele de la bancă, iar Wealth Tracker pune fiecare plată la categoria ei. Tu și partenerul
              vedeți aceleași cifre, fără să mai completați un tabel de mână.
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
        <section aria-labelledby="cum-merge" className="border-t border-line pt-12">
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

        <section aria-labelledby="ce-mai-face" className="mt-16 border-t border-line pt-12">
          <h2 id="ce-mai-face" className="font-display text-2xl">
            Ce mai face
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
