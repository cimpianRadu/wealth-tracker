'use client';

import { useState } from 'react';
import { useWealthStore } from '@/lib/store';
import { CATEGORY_LABELS, CATEGORY_COLORS, formatCurrency } from '@/lib/currency';
import type { Asset } from '@/lib/db';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, MoreHorizontal, ShoppingCart, TrendingDown, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { AddAssetModal } from './AddAssetModal';
import { AssetTransactionModal } from './AssetTransactionModal';
import { TransactionHistory } from './TransactionHistory';

export function AssetList() {
  const { assets, deleteAsset, displayCurrency, displayValue } = useWealthStore();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [transactionAsset, setTransactionAsset] = useState<Asset | null>(null);
  const [transactionType, setTransactionType] = useState<'buy' | 'sell'>('buy');
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const handleDelete = async (id: number) => {
    if (confirm('Ești sigur că vrei să ștergi acest activ?')) {
      await deleteAsset(id);
    }
  };

  const openTransaction = (asset: Asset, type: 'buy' | 'sell') => {
    setTransactionAsset(asset);
    setTransactionType(type);
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
                <div key={asset.id}>
                  <div className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50">
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
                          onClick={() => setExpandedId(expandedId === asset.id ? null : (asset.id ?? null))}
                        >
                          {expandedId === asset.id ? (
                            <ChevronUp className="h-3.5 w-3.5" />
                          ) : (
                            <ChevronDown className="h-3.5 w-3.5" />
                          )}
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7 sm:h-8 sm:w-8">
                              <MoreHorizontal className="h-3.5 w-3.5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => openTransaction(asset, 'buy')}
                              className="text-green-600"
                            >
                              <ShoppingCart className="h-4 w-4 mr-2" />
                              Cumpără
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => openTransaction(asset, 'sell')}
                              className="text-amber-600"
                            >
                              <TrendingDown className="h-4 w-4 mr-2" />
                              Vinde
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => asset.id && handleDelete(asset.id)}
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Șterge
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </div>
                  {expandedId === asset.id && asset.id && (
                    <div className="ml-6 border-l-2 border-muted">
                      <TransactionHistory entityType="asset" entityId={asset.id} />
                    </div>
                  )}
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

      {transactionAsset && (
        <AssetTransactionModal
          open={true}
          onClose={() => setTransactionAsset(null)}
          asset={transactionAsset}
          type={transactionType}
        />
      )}
    </>
  );
}
