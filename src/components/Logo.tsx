// Semnul: două carduri suprapuse, adică doi oameni și conturile lor puse la un loc.
// Zona comună e mai închisă: acolo se vede bugetul casei.

export function LogoMark({ className = 'h-7 w-7' }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      <rect x="3" y="7" width="17" height="19" rx="4" fill="var(--color-accent)" opacity="0.45" />
      <rect x="12" y="6" width="17" height="19" rx="4" fill="var(--color-accent)" opacity="0.45" />
      <rect x="12" y="7" width="8" height="18" fill="var(--color-accent)" />
    </svg>
  );
}

export function Logo({ className = '' }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <LogoMark />
      <span className="font-display text-xl whitespace-nowrap">Wealth Tracker</span>
    </span>
  );
}
