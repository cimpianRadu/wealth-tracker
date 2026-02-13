'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { AddAssetModal } from './AddAssetModal';
import { AddDebtModal } from './AddDebtModal';

export function DashboardBottomBar() {
  const [isAssetModalOpen, setIsAssetModalOpen] = useState(false);
  const [isDebtModalOpen, setIsDebtModalOpen] = useState(false);

  return (
    <>
      <div className="sticky bottom-0 z-40 w-full border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 p-3">
        <div className="container mx-auto flex gap-3 justify-center max-w-lg">
          <Button
            onClick={() => setIsAssetModalOpen(true)}
            className="flex-1"
            size="lg"
          >
            <Plus className="h-4 w-4 mr-2" />
            Adaugă Activ
          </Button>
          <Button
            onClick={() => setIsDebtModalOpen(true)}
            variant="outline"
            className="flex-1"
            size="lg"
          >
            <Plus className="h-4 w-4 mr-2" />
            Adaugă Datorie
          </Button>
        </div>
      </div>

      <AddAssetModal open={isAssetModalOpen} onClose={() => setIsAssetModalOpen(false)} />
      <AddDebtModal open={isDebtModalOpen} onClose={() => setIsDebtModalOpen(false)} />
    </>
  );
}
