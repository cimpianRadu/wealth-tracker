'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, X, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function IncognitoWarning() {
  const [isIncognito, setIsIncognito] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    async function detectIncognito() {
      try {
        const testDB = indexedDB.open('__incognito_test__');
        testDB.onerror = () => setIsIncognito(true);
        testDB.onsuccess = () => {
          if (navigator.storage && navigator.storage.estimate) {
            navigator.storage.estimate().then(estimate => {
              if (estimate.quota && estimate.quota < 120000000) {
                setIsIncognito(true);
              }
            });
          }
          indexedDB.deleteDatabase('__incognito_test__');
        };
      } catch {
        setIsIncognito(true);
      }
    }
    detectIncognito();
  }, []);

  if (!isIncognito || dismissed) return null;

  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-amber-900">
      <div className="flex items-center gap-3 min-w-0">
        <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
        <div className="min-w-0">
          <p className="font-medium text-sm">Mod Incognito Detectat</p>
          <p className="text-xs mt-0.5">
            Datele tale nu vor fi salvate după închiderea browser-ului.
            Exportă un backup JSON înainte de a închide fereastra.
          </p>
        </div>
      </div>
      <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => setDismissed(true)}>
        <X className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}

export function BackupReminder() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const shown = sessionStorage.getItem('backup-reminder-shown');
    if (!shown) {
      const timer = setTimeout(() => {
        setShow(true);
        sessionStorage.setItem('backup-reminder-shown', '1');
      }, 30000);
      return () => clearTimeout(timer);
    }
  }, []);

  if (!show) return null;

  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-blue-900">
      <div className="flex items-center gap-3 min-w-0">
        <Download className="h-4 w-4 shrink-0 text-blue-600" />
        <p className="text-sm">
          <span className="font-medium">Datele tale sunt doar în browser.</span>
          {' '}Exportă regulat un backup pentru siguranță.
        </p>
      </div>
      <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => setShow(false)}>
        <X className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
