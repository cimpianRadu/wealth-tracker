'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ExternalLink } from 'lucide-react';
import { getAllActivePartners } from '@/lib/partners-data';

export function SidebarAd() {
  const partners = getAllActivePartners().slice(0, 3);

  return (
    <Card className="border-dashed">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm text-muted-foreground font-normal">
          Recomandări
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {partners.map((partner) => (
          <a
            key={partner.id}
            href={partner.url}
            target="_blank"
            rel="noopener noreferrer sponsored"
            className="block p-3 rounded-lg border border-dashed hover:border-primary/50 hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div
                className="w-7 h-7 rounded-full shrink-0 flex items-center justify-center text-white font-bold text-xs"
                style={{ backgroundColor: partner.color }}
              >
                {partner.name[0]}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-sm">{partner.name}</p>
                  <ExternalLink className="h-3 w-3 text-muted-foreground shrink-0" />
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 truncate">
                  {partner.shortDescription}
                </p>
              </div>
            </div>
          </a>
        ))}
        <p className="text-[10px] text-muted-foreground text-center pt-1">
          Spațiu publicitar disponibil — <a href="mailto:contact@wealthtracker.ro" className="underline">contactează-ne</a>
        </p>
      </CardContent>
    </Card>
  );
}
