'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { getAllActivePartners, getPremiumPartner, type Partner } from '@/lib/partners-data';
import { ArrowRight } from 'lucide-react';

function PartnerLogo({ partner, size = 20 }: { partner: Partner; size?: number }) {
  return (
    <div
      className="rounded-full shrink-0 flex items-center justify-center text-white font-bold"
      style={{
        width: size,
        height: size,
        backgroundColor: partner.color,
        fontSize: size * 0.45,
      }}
    >
      {partner.name[0]}
    </div>
  );
}

function PartnerPill({
  partner,
  isPremium,
  fading,
  className,
}: {
  partner: Partner;
  isPremium?: boolean;
  fading?: boolean;
  className?: string;
}) {
  return (
    <a
      href={partner.url}
      target="_blank"
      rel="noopener noreferrer sponsored"
      className={cn(
        'flex items-center gap-2 px-4 py-2 rounded-full border bg-card',
        'transition-all duration-300 ease-in-out hover:shadow-sm',
        isPremium && 'border-amber-400 bg-amber-50/50 ring-1 ring-amber-200/50',
        fading ? 'opacity-0 scale-95' : 'opacity-100 scale-100',
        className,
      )}
    >
      <PartnerLogo partner={partner} size={20} />
      <span className="text-sm font-medium whitespace-nowrap">{partner.name}</span>
      {isPremium && (
        <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-medium">
          Recomandat
        </span>
      )}
    </a>
  );
}

export function TopBanner({ sticky = false }: { sticky?: boolean }) {
  const premium = getPremiumPartner();
  const standard = getAllActivePartners().filter(p => !p.isPremium);

  const leftPool = standard.slice(0, Math.ceil(standard.length / 2));
  const rightPool = standard.slice(Math.ceil(standard.length / 2));

  const [leftIndex, setLeftIndex] = useState(0);
  const [rightIndex, setRightIndex] = useState(0);
  const [fadingLeft, setFadingLeft] = useState(false);
  const [fadingRight, setFadingRight] = useState(false);

  useEffect(() => {
    if (leftPool.length <= 1) return;
    const interval = setInterval(() => {
      setFadingLeft(true);
      setTimeout(() => {
        setLeftIndex(prev => (prev + 1) % leftPool.length);
        setFadingLeft(false);
      }, 300);
    }, 15000);
    return () => clearInterval(interval);
  }, [leftPool.length]);

  useEffect(() => {
    if (rightPool.length <= 1) return;
    const interval = setInterval(() => {
      setFadingRight(true);
      setTimeout(() => {
        setRightIndex(prev => (prev + 1) % rightPool.length);
        setFadingRight(false);
      }, 300);
    }, 18000);
    return () => clearInterval(interval);
  }, [rightPool.length]);

  const leftVisible = leftPool.length > 0
    ? [
        leftPool[leftIndex % leftPool.length],
        leftPool[(leftIndex + 1) % leftPool.length],
      ]
    : [];

  const rightVisible = rightPool.length > 0
    ? [
        rightPool[rightIndex % rightPool.length],
        rightPool[(rightIndex + 1) % rightPool.length],
      ]
    : [];

  return (
    <div
      className={cn(
        'w-full px-4 py-3',
        sticky
          ? 'sticky top-14 z-40 border-b bg-background/95 backdrop-blur-sm'
          : 'rounded-lg border bg-muted/20',
      )}
    >
      <div className="flex items-center justify-center gap-2 sm:gap-3 overflow-hidden">
        {/* Left rotating pills — hidden on small screens */}
        {leftVisible.map((partner, i) => (
          <PartnerPill
            key={`left-${partner.id}-${i}`}
            partner={partner}
            fading={fadingLeft}
            className={i === 0 ? 'hidden lg:flex' : 'hidden md:flex'}
          />
        ))}

        {/* Fixed center premium pill */}
        {premium && <PartnerPill partner={premium} isPremium />}

        {/* Right rotating pills — hidden on small screens */}
        {rightVisible.map((partner, i) => (
          <PartnerPill
            key={`right-${partner.id}-${i}`}
            partner={partner}
            fading={fadingRight}
            className={i === 1 ? 'hidden lg:flex' : 'hidden md:flex'}
          />
        ))}

        {/* Link to recommendations */}
        <Link
          href="/recommendations"
          className="hidden sm:flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors whitespace-nowrap ml-2"
        >
          Vezi toate <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    </div>
  );
}
