# wealthtracker.ro v2: cheltuielile casei, în doi

Next.js 16 + Neon Postgres. Fără servicii legate de un hosting anume: rulează pe Vercel, Cloudflare (OpenNext) sau un server cu `next start`.

## Ce face

- **Login** cu Google sau cu cod de 6 cifre pe email (Resend). Fără parole.
- **Gospodărie și partener**: link de invitație valabil 7 zile, o singură folosire.
- **Extrase PDF**: textul e extras în memorie, IBAN/card/CNP mascate, tranzacțiile citite cu Claude într-o ciornă pe care o verifici înainte de salvare. PDF-ul nu se păstrează. Duplicatele (inclusiv plățile „în așteptare” care apar decontate luna următoare) sunt sărite.
- **Termen lunar pentru extrase**: ziua setată în gospodărie, banner în aplicație și email cu 2 zile înainte și în ziua termenului (GitHub Actions apelează `/api/cron/reminders`).
- **Panou**: total vs. medie, buget pe membru (fără banii dați partenerului și fără PFA), grafic pe 12 luni, categorii, plăți recurente, insights, „amintiri” animate (acum un an, locul vostru, cea mai scumpă zi).
- **Asistent**: Claude cu tool-uri care interoghează doar tranzacțiile gospodăriei.
- **GDPR**: export JSON și ștergerea contului din Setări.
- **/demo**: panoul cu date inventate, fără DB.

## Pornire

```bash
cp .env.example .env.local   # completează valorile
npm install
npm run db:migrate           # creează tabelele în Neon
npm run dev
```

## Ce trebuie configurat o dată

1. **Neon**: proiect în regiunea Frankfurt, `DATABASE_URL` (pooled), apoi `npm run db:migrate`.
2. **Google**: OAuth client „Web application”, redirect `https://wealthtracker.ro/api/auth/google/callback`.
3. **Resend**: domeniul `wealthtracker.ro` verificat, `RESEND_API_KEY`, `RESEND_FROM`.
4. **Anthropic**: `ANTHROPIC_API_KEY`.

`AUTH_SECRET`, `APP_URL` și `CRON_SECRET` sunt opționale: cheia de semnare se generează singură în baza de date, adresa vine din request, iar reminderul e idempotent.

## Structură

- `db/migrations/` schema SQL, aplicată cu `scripts/db-migrate.mjs`
- `src/lib/auth/` sesiuni HMAC, coduri pe email, Google OAuth
- `src/lib/household.ts` accesul la datele gospodăriei (verifică membership-ul)
- `src/lib/insights.ts` calculele din panou, funcții pure (folosite și de demo)
- `src/lib/ai/` citirea extraselor și asistentul
