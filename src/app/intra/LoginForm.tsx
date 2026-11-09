'use client';

import { useState } from 'react';

export function LoginForm({ next, googleEnabled }: { next: string; googleEnabled: boolean }) {
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function post(url: string, body: object) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data = (await res.json().catch(() => ({}))) as { error?: string; next?: string };
      if (!res.ok) {
        setError(data.error ?? 'A apărut o eroare.');
        return null;
      }
      return data;
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-8 space-y-6">
      {googleEnabled && (
        <>
          <a href={`/api/auth/google?next=${encodeURIComponent(next)}`} className="btn btn-ghost w-full py-3">
            <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.1A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.44.34-2.1V7.07H2.18A11 11 0 0 0 1 12c0 1.78.43 3.45 1.18 4.93l3.66-2.84z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15A11 11 0 0 0 12 1 11 11 0 0 0 2.18 7.07L5.84 9.9C6.71 7.31 9.14 5.38 12 5.38z" />
            </svg>
            Continuă cu Google
          </a>
          <div className="flex items-center gap-3 text-xs uppercase tracking-wider text-muted">
            <span className="h-px flex-1 bg-line" /> sau <span className="h-px flex-1 bg-line" />
          </div>
        </>
      )}

      {step === 'email' ? (
        <form
          className="space-y-3"
          onSubmit={async (e) => {
            e.preventDefault();
            if (await post('/api/auth/code', { email })) setStep('code');
          }}
        >
          <label className="block text-sm font-medium" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            className="field"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="nume@exemplu.ro"
          />
          <button className="btn w-full py-3" disabled={busy}>
            {busy ? 'Trimit codul…' : 'Trimite-mi un cod'}
          </button>
        </form>
      ) : (
        <form
          className="space-y-3"
          onSubmit={async (e) => {
            e.preventDefault();
            const data = await post('/api/auth/verify', { email, code, next });
            if (data) window.location.href = data.next ?? next;
          }}
        >
          <p className="text-sm text-muted">
            Am trimis un cod de 6 cifre la <strong className="text-ink">{email}</strong>. Verifică și folderul de spam.
          </p>
          <input
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="\d{6}"
            maxLength={6}
            required
            className="field tabular text-center text-2xl tracking-[0.4em]"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
            aria-label="Codul de 6 cifre"
          />
          <button className="btn w-full py-3" disabled={busy || code.length !== 6}>
            {busy ? 'Verific…' : 'Intră'}
          </button>
          <button type="button" className="text-sm text-muted underline" onClick={() => setStep('email')}>
            Altă adresă
          </button>
        </form>
      )}
      {error && <p className="rounded-lg bg-bad-soft px-3 py-2 text-sm text-bad">{error}</p>}
    </div>
  );
}
