import Link from 'next/link';

export const metadata = { title: 'Confidențialitate · Wealth Tracker' };

const SECTIONS: { title: string; body: string[] }[] = [
  {
    title: 'Ce date ținem',
    body: [
      'Adresa de email și numele, pentru cont. Dacă intri cu Google, primim de la Google doar emailul, numele și un identificator al contului.',
      'Tranzacțiile citite din extrasele încărcate: data, comerciantul, suma, moneda, categoria. Le folosim doar ca să vă arătăm cheltuielile și să răspundem la întrebările voastre.',
      'Setările gospodăriei: membrii, bugetele, termenul pentru extrase, cursurile valutare.',
    ],
  },
  {
    title: 'Ce nu ținem',
    body: [
      'Fișierele PDF ale extraselor. Sunt citite în memorie la încărcare și apoi aruncate.',
      'IBAN-uri complete, numere de card sau CNP-uri. Înainte de citire le ascundem, rămân doar ultimele 4 caractere.',
      'Parole. Intrarea se face cu Google sau cu un cod trimis pe email.',
    ],
  },
  {
    title: 'Cine mai vede datele',
    body: [
      'Membrii gospodăriei voastre: fiecare vede tranzacțiile tuturor, pentru că asta e ideea aplicației. Nu inviți pe cineva în care nu ai încredere.',
      'Furnizorii care ne ajută să rulăm aplicația: baza de date (Neon, în Uniunea Europeană), găzduirea aplicației, emailul (Resend) și modelul AI care citește extrasele și răspunde la întrebări (Anthropic). Textul extrasului, deja mascat, și întrebările voastre ajung la Anthropic doar pentru procesare.',
      'Nu vindem date și nu afișăm reclame bazate pe ele.',
    ],
  },
  {
    title: 'Drepturile voastre',
    body: [
      'Din Setări puteți descărca toate datele voastre (JSON) și vă puteți șterge contul. La ștergere pleacă tranzacțiile voastre; dacă erați singurul membru, toată gospodăria.',
      'Pentru orice altă cerere: contact@wealthtracker.ro.',
    ],
  },
];

export default function Privacy() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      <Link href="/" className="font-display text-xl">
        Wealth Tracker
      </Link>
      <h1 className="font-display mt-8 text-4xl">Confidențialitate</h1>
      <p className="mt-3 text-muted">
        Pe scurt: ținem cât e nevoie ca aplicația să funcționeze, nu păstrăm extrasele și puteți șterge totul oricând.
      </p>
      {SECTIONS.map((s) => (
        <section key={s.title} className="mt-10">
          <h2 className="text-xl font-semibold">{s.title}</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-muted">
            {s.body.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>
        </section>
      ))}
    </main>
  );
}
