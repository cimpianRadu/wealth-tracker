'use client';

import { useState, useTransition } from 'react';
import { Check, Copy, Link2 } from 'lucide-react';
import { createInvite } from '@/lib/actions/household';

export function InviteButton() {
  const [url, setUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [pending, start] = useTransition();

  return (
    <div className="space-y-3">
      <button
        className="btn btn-accent"
        disabled={pending}
        onClick={() =>
          start(async () => {
            const res = await createInvite();
            if ('url' in res) setUrl(res.url.startsWith('http') ? res.url : `${window.location.origin}${res.url}`);
            setCopied(false);
          })
        }
      >
        <Link2 className="h-4 w-4" aria-hidden /> {pending ? 'Generez…' : 'Generează link de invitație'}
      </button>
      {url && (
        <div className="flex items-center gap-2">
          <input readOnly value={url} className="field tabular text-sm" onFocus={(e) => e.target.select()} />
          <button
            className="btn btn-ghost"
            onClick={async () => {
              await navigator.clipboard.writeText(url);
              setCopied(true);
            }}
            aria-label="Copiază linkul"
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </button>
        </div>
      )}
      {url && <p className="text-sm text-muted">Trimite-l pe WhatsApp sau email. E valabil 7 zile și merge o singură dată.</p>}
    </div>
  );
}
