'use client';

import { useState } from 'react';
import { useWealthStore } from '@/lib/store';
import { DEBT_CATEGORY_LABELS, formatCurrency } from '@/lib/currency';
import type { Debt } from '@/lib/db';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { AddDebtModal } from './AddDebtModal';

export function DebtList() {
  const { debts, deleteDebt, displayCurrency, displayValue } = useWealthStore();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingDebt, setEditingDebt] = useState<Debt | null>(null);

  const handleDelete = async (id: number) => {
    if (confirm('Ești sigur că vrei să ștergi această datorie?')) {
      await deleteDebt(id);
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-lg">Datorii</CardTitle>
          <Button size="sm" onClick={() => setIsAddOpen(true)}>
            <Plus className="h-4 w-4 mr-1" /> Adaugă
          </Button>
        </CardHeader>
        <CardContent>
          {debts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p className="mb-2">Nu ai datorii înregistrate.</p>
              <Button variant="outline" onClick={() => setIsAddOpen(true)}>
                <Plus className="h-4 w-4 mr-1" /> Adaugă datorie
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {debts.map(debt => (
                <div
                  key={debt.id}
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50"
                >
                  <div className="min-w-0">
                    <p className="font-medium truncate">{debt.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge variant="destructive" className="text-xs">
                        {DEBT_CATEGORY_LABELS[debt.category] || debt.category}
                      </Badge>
                      {debt.interestRate && (
                        <span className="text-xs text-muted-foreground">
                          {debt.interestRate}% dobândă
                        </span>
                      )}
                      {debt.dueDate && (
                        <span className="text-xs text-muted-foreground">
                          Scadentă: {debt.dueDate}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 sm:gap-2 shrink-0 ml-2 sm:ml-4">
                    <p className="font-semibold text-red-600 text-sm sm:text-base">
                      -{formatCurrency(displayValue(debt.amountRON), displayCurrency)}
                    </p>
                    <div className="flex gap-0.5">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 sm:h-8 sm:w-8"
                        onClick={() => setEditingDebt(debt)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 sm:h-8 sm:w-8 text-red-500 hover:text-red-600"
                        onClick={() => debt.id && handleDelete(debt.id)}
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

      <AddDebtModal open={isAddOpen} onClose={() => setIsAddOpen(false)} />

      {editingDebt && (
        <AddDebtModal
          open={true}
          onClose={() => setEditingDebt(null)}
          debt={editingDebt}
        />
      )}
    </>
  );
}
