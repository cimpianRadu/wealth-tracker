import Link from 'next/link';
import { FileUp, MessageCircle, Sparkles, Users } from 'lucide-react';

const FEATURES = [
  {
    icon: FileUp,
    title: 'Încărcați extrasele PDF',
    text: 'BT, Revolut, ING și altele. Tranzacțiile sunt citite automat și împărțite pe categorii. Le verificați înainte să fie salvate.',
  },
  {
    icon: Users,
    title: 'În doi, pe aceleași cifre',
    text: 'Invitați partenerul cu un link. Fiecare își încarcă extrasele, iar casa vede totul la un loc, cu bugetul fiecăruia separat.',
  },
  {
    icon: Sparkles,
    title: 'Insights și amintiri',
    text: 'Plăți recurente, categoriile care au crescut, cât costă cafeaua pe un an și cum arăta octombrie de anul trecut.',
  },
  {
    icon: MessageCircle,
    title: 'Întrebați direct',
    text: '„Cât am cheltuit pe supermarket în ultimele trei luni?” Asistentul răspunde din datele voastre, nu din presupuneri.',
  },
];

export default function Home() {
  return (
    <main className="mx-auto max-w-5xl px-4 pb-20">
      <header className="flex items-center justify-between py-6">
        <span className="font-display text-xl">Wealth Tracker</span>
        <nav className="flex items-center gap-2">
          <Link href="/demo" className="btn btn-ghost">
            Demo
          </Link>
          <Link href="/intra" className="btn">
            Intră
          </Link>
        </nav>
      </header>

      <section className="py-14 md:py-24">
        <p className="text-sm font-semibold uppercase tracking-wider text-accent">Cheltuielile casei, în doi</p>
        <h1 className="font-display mt-4 max-w-3xl text-4xl leading-tight md:text-6xl">
          Știți exact unde se duc banii, fără să copiați nimic de mână.
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-muted">
          Încărcați extrasele de cont o dată pe lună. Restul îl face aplicația: categorii, totaluri pe săptămâni și pe
          membri, plăți recurente și un asistent care vă răspunde la întrebări despre bani.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/intra" className="btn btn-accent">
            Începe gratuit
          </Link>
          <Link href="/demo" className="btn btn-ghost">
            Vezi un exemplu
          </Link>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        {FEATURES.map((f) => (
          <div key={f.title} className="card p-6">
            <f.icon className="h-6 w-6 text-accent" aria-hidden />
            <h2 className="mt-4 text-lg font-semibold">{f.title}</h2>
            <p className="mt-2 text-muted">{f.text}</p>
          </div>
        ))}
      </section>

      <footer className="mt-16 flex flex-wrap gap-4 text-sm text-muted">
        <Link href="/confidentialitate">Confidențialitate</Link>
        <a href="mailto:contact@wealthtracker.ro">contact@wealthtracker.ro</a>
      </footer>
    </main>
  );
}
