'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowUp, Loader2 } from 'lucide-react';
import clsx from 'clsx';

interface Msg {
  role: 'user' | 'assistant';
  content: string;
}

const SUGGESTIONS = [
  'Cât cheltuim pe lună pe supermarket, în medie?',
  'Care sunt abonamentele noastre și cât costă pe an?',
  'Pe ce am cheltuit mai mult luna trecută față de media noastră?',
  'Cât s-a dus pe restaurante și livrări în ultimele 3 luni, pe fiecare dintre noi?',
];

export function Chat({ name }: { name: string }) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const end = useRef<HTMLDivElement>(null);

  useEffect(() => {
    end.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, busy]);

  async function send(text: string) {
    const q = text.trim();
    if (!q || busy) return;
    const next = [...messages, { role: 'user' as const, content: q }];
    setMessages(next);
    setInput('');
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: next }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) setError(data.error ?? 'Eroare.');
      else setMessages([...next, { role: 'assistant', content: data.reply }]);
    } catch {
      setError('Conexiunea s-a întrerupt.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-[70dvh] flex-col">
      <div className="flex-1 space-y-4">
        {!messages.length && (
          <div className="py-8">
            <h1 className="font-display text-3xl">Salut, {name}.</h1>
            <p className="mt-2 text-muted">Întreabă orice despre cheltuielile casei. Răspunsurile vin din tranzacțiile voastre.</p>
            <div className="mt-6 grid gap-2 sm:grid-cols-2">
              {SUGGESTIONS.map((s) => (
                <button key={s} onClick={() => send(s)} className="card px-4 py-3 text-left text-sm hover:border-accent">
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={clsx('flex', m.role === 'user' ? 'justify-end' : 'justify-start')}>
            <div
              className={clsx(
                'max-w-[85%] rounded-2xl px-4 py-3 text-[15px] leading-relaxed whitespace-pre-wrap',
                m.role === 'user' ? 'bg-ink text-paper' : 'card',
              )}
            >
              {m.content}
            </div>
          </div>
        ))}
        {busy && (
          <div className="flex items-center gap-2 text-sm text-muted">
            <Loader2 className="h-4 w-4 animate-spin" /> Mă uit prin tranzacții…
          </div>
        )}
        {error && <p className="rounded-lg bg-bad-soft px-3 py-2 text-sm text-bad">{error}</p>}
        <div ref={end} />
      </div>

      <form
        className="sticky bottom-4 mt-6 flex items-end gap-2 rounded-2xl border border-line bg-card p-2 shadow-sm"
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
      >
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              send(input);
            }
          }}
          rows={1}
          placeholder="Cât am cheltuit pe cafea anul ăsta?"
          className="max-h-40 flex-1 resize-none bg-transparent px-3 py-2 outline-none"
        />
        <button className="btn btn-accent h-10 w-10 p-0" disabled={busy || !input.trim()} aria-label="Trimite">
          <ArrowUp className="h-5 w-5" />
        </button>
      </form>
    </div>
  );
}
