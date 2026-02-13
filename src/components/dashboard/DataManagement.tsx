'use client';

import { useRef, useState } from 'react';
import { useWealthStore } from '@/lib/store';
import { exportAllData, importData, exportAssetsCSV, exportDebtsCSV } from '@/lib/db';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Upload, Camera, Database } from 'lucide-react';
import { toast } from 'sonner';

export function DataManagement() {
  const { assets, debts, createSnapshot, loadAll, addBackupEntry } = useWealthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const handleExportJSON = async () => {
    setIsExporting(true);
    try {
      const data = await exportAllData();
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `wealth-tracker-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      addBackupEntry('json');
      toast.success('Backup JSON exportat cu succes!');
    } catch {
      toast.error('Eroare la export.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportCSV = () => {
    try {
      if (assets.length > 0) {
        const assetsCSV = exportAssetsCSV(assets);
        const blob1 = new Blob([assetsCSV], { type: 'text/csv' });
        const url1 = URL.createObjectURL(blob1);
        const a1 = document.createElement('a');
        a1.href = url1;
        a1.download = `wealth-tracker-assets-${new Date().toISOString().split('T')[0]}.csv`;
        a1.click();
        URL.revokeObjectURL(url1);
      }

      if (debts.length > 0) {
        const debtsCSV = exportDebtsCSV(debts);
        const blob2 = new Blob([debtsCSV], { type: 'text/csv' });
        const url2 = URL.createObjectURL(blob2);
        const a2 = document.createElement('a');
        a2.href = url2;
        a2.download = `wealth-tracker-debts-${new Date().toISOString().split('T')[0]}.csv`;
        a2.click();
        URL.revokeObjectURL(url2);
      }

      addBackupEntry('csv');
      toast.success('Fișiere CSV exportate cu succes!');
    } catch {
      toast.error('Eroare la export CSV.');
    }
  };

  const handleImportJSON = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const text = await file.text();
      await importData(text);
      await loadAll();
      toast.success('Date importate cu succes!');
    } catch {
      toast.error('Eroare la import. Verifică formatul fișierului.');
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSnapshot = async () => {
    try {
      await createSnapshot();
      toast.success('Snapshot lunar salvat!');
    } catch {
      toast.error('Eroare la salvarea snapshot-ului.');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Database className="h-4 w-4" />
          Gestionare Date
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div>
            <Button
              variant="outline"
              onClick={handleExportJSON}
              disabled={isExporting}
              className="w-full justify-start"
            >
              <Download className="h-4 w-4 mr-2" />
              Backup Complet (JSON)
            </Button>
            <p className="text-xs text-muted-foreground mt-1 ml-1">
              Salvează toate datele tale într-un fișier. Poți restaura oricând din acest fișier, inclusiv pe alt dispozitiv.
            </p>
          </div>

          <div>
            <Button
              variant="outline"
              onClick={handleExportCSV}
              className="w-full justify-start"
            >
              <Download className="h-4 w-4 mr-2" />
              Export CSV (Excel)
            </Button>
            <p className="text-xs text-muted-foreground mt-1 ml-1">
              Descarcă activele și datoriile în format tabel, util pentru analiză în Excel sau Google Sheets.
            </p>
          </div>

          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleImportJSON}
              className="hidden"
            />
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={isImporting}
              className="w-full justify-start"
            >
              <Upload className="h-4 w-4 mr-2" />
              {isImporting ? 'Se importă...' : 'Restaurează din Backup'}
            </Button>
            <p className="text-xs text-muted-foreground mt-1 ml-1">
              Încarcă un fișier JSON exportat anterior. Atenție: datele curente vor fi înlocuite complet.
            </p>
          </div>
        </div>

        <div className="border-t pt-4">
          <Button
            variant="outline"
            onClick={handleSnapshot}
            className="w-full justify-start"
          >
            <Camera className="h-4 w-4 mr-2" />
            Salvează Snapshot Lunar
          </Button>
          <p className="text-xs text-muted-foreground mt-1 ml-1">
            Fotografiază starea financiară de azi. Snapshot-urile apar în graficul Evoluție Lunară din pagina de Analiză.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
