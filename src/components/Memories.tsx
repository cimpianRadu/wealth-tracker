'use client';

import { useCallback, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { X } from 'lucide-react';
import type { Memory } from '@/lib/insights';

// Fundaluri pentru „amintiri”, câte unul pe fel, ca în Apple Photos: culoare plină,
// un gradient lent care se mișcă în spate și textul care intră pe rând.
const THEMES = [
  ['#1f4d3a', '#3f8f68', '#c8e6c9'],
  ['#7c2d12', '#c2410c', '#fed7aa'],
  ['#312e81', '#6d28d9', '#ddd6fe'],
  ['#0c4a6e', '#0284c7', '#bae6fd'],
  ['#422006', '#a16207', '#fef08a'],
];

const DURATION = 6000;

function Backdrop({ theme }: { theme: number }) {
  const [a, b, c] = THEMES[theme % THEMES.length];
  return (
    <motion.div
      className="absolute inset-0"
      style={{ background: `radial-gradient(120% 90% at 20% 10%, ${b} 0%, ${a} 60%)` }}
      initial={{ scale: 1.15 }}
      animate={{ scale: 1 }}
      transition={{ duration: DURATION / 1000, ease: 'linear' }}
    >
      <motion.div
        className="absolute -right-20 -bottom-24 h-80 w-80 rounded-full blur-3xl"
        style={{ background: c, opacity: 0.35 }}
        animate={{ x: [0, -40, 0], y: [0, -30, 0] }}
        transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
      />
    </motion.div>
  );
}

export function Memories({ memories }: { memories: Memory[] }) {
  const [open, setOpen] = useState<number | null>(null);

  const close = useCallback(() => setOpen(null), []);
  const next = useCallback(() => setOpen((i) => (i == null ? null : i + 1 < memories.length ? i + 1 : null)), [memories.length]);
  const prev = useCallback(() => setOpen((i) => (i == null ? null : Math.max(0, i - 1))), []);

  useEffect(() => {
    if (open == null) return;
    const t = setTimeout(next, DURATION);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowRight') next();
      if (e.key === 'ArrowLeft') prev();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      clearTimeout(t);
      window.removeEventListener('keydown', onKey);
    };
  }, [open, next, prev, close]);

  if (!memories.length) return null;
  const m = open != null ? memories[open] : null;

  return (
    <section aria-label="Amintiri">
      <div className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2">
        {memories.map((mem, i) => {
          const [a, b] = THEMES[mem.theme % THEMES.length];
          return (
            <motion.button
              key={mem.id}
              onClick={() => setOpen(i)}
              whileHover={{ y: -3 }}
              whileTap={{ scale: 0.97 }}
              className="relative h-44 w-36 shrink-0 snap-start overflow-hidden rounded-2xl p-3 text-left text-white shadow-sm sm:w-40"
              style={{ background: `linear-gradient(160deg, ${b}, ${a})` }}
            >
              <span className="text-[11px] font-semibold uppercase tracking-wider opacity-80">{mem.kicker}</span>
              <span className="font-display absolute right-3 bottom-3 left-3 text-lg leading-tight">{mem.title}</span>
            </motion.button>
          );
        })}
      </div>

      <AnimatePresence>
        {m && open != null && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-0 sm:p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={close}
          >
            <motion.div
              key={m.id}
              className="relative h-full w-full overflow-hidden text-white sm:h-[640px] sm:max-h-full sm:w-[380px] sm:rounded-3xl"
              initial={{ scale: 0.94, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 260, damping: 26 }}
              onClick={(e) => e.stopPropagation()}
            >
              <Backdrop theme={m.theme} />
              <div className="absolute top-3 right-3 left-3 flex gap-1">
                {memories.map((_, i) => (
                  <div key={i} className="h-1 flex-1 overflow-hidden rounded-full bg-white/30">
                    {i < open && <div className="h-full w-full bg-white" />}
                    {i === open && (
                      <motion.div
                        className="h-full bg-white"
                        initial={{ width: '0%' }}
                        animate={{ width: '100%' }}
                        transition={{ duration: DURATION / 1000, ease: 'linear' }}
                      />
                    )}
                  </div>
                ))}
              </div>
              <button onClick={close} className="absolute top-6 right-3 rounded-full p-2 hover:bg-white/10" aria-label="Închide">
                <X className="h-5 w-5" />
              </button>
              {/* Zonele de atins: stânga înapoi, dreapta înainte, ca la stories. */}
              <button className="absolute inset-y-0 left-0 w-1/3" onClick={prev} aria-label="Înapoi" />
              <button className="absolute inset-y-0 right-0 w-2/3" onClick={next} aria-label="Înainte" />
              <div className="pointer-events-none absolute right-6 bottom-12 left-6">
                <motion.p
                  className="text-xs font-semibold uppercase tracking-[0.2em] opacity-80"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 0.8, y: 0 }}
                  transition={{ delay: 0.15 }}
                >
                  {m.kicker}
                </motion.p>
                <motion.h3
                  className="font-display mt-2 text-4xl leading-tight"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35 }}
                >
                  {m.title}
                </motion.h3>
                <motion.p
                  className="tabular mt-4 text-5xl font-semibold"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.7, type: 'spring', stiffness: 200 }}
                >
                  {m.value}
                </motion.p>
                <motion.p
                  className="mt-4 text-base leading-relaxed opacity-90"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 0.9, y: 0 }}
                  transition={{ delay: 1.1 }}
                >
                  {m.detail}
                </motion.p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
