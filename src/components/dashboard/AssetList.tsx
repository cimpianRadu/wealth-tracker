'use client';

import { useState } from 'react';
import { useWealthStore } from '@/lib/store';
import { CATEGORY_LABELS, CATEGORY_COLORS, formatCurrency } from '@/lib/currency';
import type { Asset } from '@/lib/db';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { AddAssetModal } from './AddAssetModal';

export function AssetList() {
  const { assets, deleteAsset, displayCurrency, displayValue } = useWealthStore();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);

  const handleDelete = async (id: number) => {
    if (confirm('Ești sigur că vrei să ștergi acest activ?')) {
      await deleteAsset(id);
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-lg">Active</CardTitle>
          <Button size="sm" onClick={() => setIsAddOpen(true)}>
            <Plus className="h-4 w-4 mr-1" /> Adaugă
          </Button>
        </CardHeader>
        <CardContent>
          {assets.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p className="mb-2">Nu ai adăugat niciun activ încă.</p>
              <Button variant="outline" onClick={() => setIsAddOpen(true)}>
                <Plus className="h-4 w-4 mr-1" /> Adaugă primul activ
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {assets.map(asset => (
                <div
                  key={asset.id}
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: CATEGORY_COLORS[asset.category] }}
                    />
                    <div className="min-w-0">
                      <p className="font-medium truncate">{asset.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge variant="secondary" className="text-xs">
                          {CATEGORY_LABELS[asset.category]}
                        </Badge>
                        {asset.notes && (
                          <span className="text-xs text-muted-foreground truncate">
                            {asset.notes}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 sm:gap-2 shrink-0 ml-2 sm:ml-4">
                    <div className="text-right">
                      <p className="font-semibold text-sm sm:text-base">
                        {formatCurrency(displayValue(asset.valueRON), displayCurrency)}
                      </p>
                      {asset.amount !== 1 && (
                        <p className="text-xs text-muted-foreground">
                          {asset.amount} unități
                        </p>
                      )}
                    </div>
                    <div className="flex gap-0.5">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 sm:h-8 sm:w-8"
                        onClick={() => setEditingAsset(asset)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 sm:h-8 sm:w-8 text-red-500 hover:text-red-600"
                        onClick={() => asset.id && handleDelete(asset.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <AddAssetModal
        open={isAddOpen}
        onClose={() => setIsAddOpen(false)}
      />

      {editingAsset && (
        <AddAssetModal
          open={true}
          onClose={() => setEditingAsset(null)}
          asset={editingAsset}
        />
      )}
    </>
  );
}
