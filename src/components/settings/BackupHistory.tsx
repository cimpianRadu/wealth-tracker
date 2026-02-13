'use client';

import { useWealthStore } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { History } from 'lucide-react';

export function BackupHistory() {
  const { backupHistory } = useWealthStore();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <History className="h-4 w-4" />
          Istoric Backup-uri
        </CardTitle>
      </CardHeader>
      <CardContent>
        {backupHistory.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nu ai exportat niciun backup încă. Exportă regulat pentru siguranță.
          </p>
        ) : (
          <div className="space-y-2">
            {backupHistory.slice().reverse().map((entry, i) => (
              <div key={i} className="flex items-center justify-between text-sm p-2 rounded-lg border">
                <span>
                  {new Date(entry.date).toLocaleDateString('ro-RO', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
                <Badge variant="secondary">{entry.type.toUpperCase()}</Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
