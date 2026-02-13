'use client';

import { useState, useEffect } from 'react';
import { X, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getPremiumPartner } from '@/lib/partners-data';

export function PremiumPopup() {
  const [dismissed, setDismissed] = useState(true);
  const [visible, setVisible] = useState(false);
  const premium = getPremiumPartner();

  useEffect(() => {
    if (!premium) return;
    if (sessionStorage.getItem('premium-popup-dismissed') === 'true') return;

    const timer = setTimeout(() => {
      setDismissed(false);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setVisible(true));
      });
    }, 5000);

    return () => clearTimeout(timer);
  }, [premium]);

  const handleDismiss = () => {
    setVisible(false);
    setTimeout(() => {
      setDismissed(true);
      sessionStorage.setItem('premium-popup-dismissed', 'true');
    }, 300);
  };

  if (!premium || dismissed) return null;

  return (
    <div
      className={cn(
        'fixed bottom-4 right-4 left-4 sm:left-auto z-50 sm:w-72',
        'bg-card border border-amber-200 rounded-xl shadow-lg p-3 sm:p-4',
        'transition-all duration-300 ease-out',
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4',
      )}
    >
      <button
        onClick={handleDismiss}
        className="absolute top-2 right-2 p-1 rounded-full hover:bg-muted transition-colors"
        aria-label="Închide"
      >
        <X className="h-4 w-4 text-muted-foreground" />
      </button>

      <div className="flex items-start gap-3">
        <div
          className="w-12 h-12 rounded-lg shrink-0 flex items-center justify-center text-white font-bold text-lg"
          style={{ backgroundColor: premium.color }}
        >
          {premium.name[0]}
        </div>
        <div className="min-w-0 pr-4">
          <div className="flex items-center gap-1.5">
            <h4 className="font-semibold text-sm">{premium.name}</h4>
            <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-medium">
              Recomandat
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
            {premium.shortDescription}
          </p>
          <a
            href={premium.url}
            target="_blank"
            rel="noopener noreferrer sponsored"
            className="inline-flex items-center gap-1 text-xs text-primary font-medium mt-2 hover:underline"
          >
            Află mai multe <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>
    </div>
  );
}
