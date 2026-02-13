import { Header, Footer } from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, Users, Eye, Clock } from 'lucide-react';

export const metadata = {
  title: 'Statistici Trafic — Wealth Tracker România',
  description: 'Statistici publice de trafic pentru Wealth Tracker România. Transparență totală.',
};

export default function StatsPage() {
  const plausibleDomain = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Statistici Trafic</h1>
          <p className="text-muted-foreground">
            Transparență totală — statisticile noastre sunt publice. Nu folosim cookies.
          </p>
        </div>

        {/* Metric cards */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4 mb-8">
          <Card>
            <CardContent className="p-4 text-center">
              <Users className="h-6 w-6 mx-auto text-primary mb-2" />
              <p className="text-2xl font-bold">—</p>
              <p className="text-xs text-muted-foreground">Vizitatori Unici / Lună</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Eye className="h-6 w-6 mx-auto text-primary mb-2" />
              <p className="text-2xl font-bold">—</p>
              <p className="text-xs text-muted-foreground">Vizualizări Pagini</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Clock className="h-6 w-6 mx-auto text-primary mb-2" />
              <p className="text-2xl font-bold">—</p>
              <p className="text-xs text-muted-foreground">Durată Medie Sesiune</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <BarChart3 className="h-6 w-6 mx-auto text-primary mb-2" />
              <p className="text-2xl font-bold">—</p>
              <p className="text-xs text-muted-foreground">Rata de Revenire</p>
            </CardContent>
          </Card>
        </div>

        {/* Plausible embed */}
        {plausibleDomain ? (
          <Card>
            <CardHeader>
              <CardTitle>Dashboard Analitic</CardTitle>
            </CardHeader>
            <CardContent>
              <iframe
                plausible-embed=""
                src={`https://plausible.io/share/${plausibleDomain}?auth=&embed=true&theme=light`}
                loading="lazy"
                style={{ width: '1px', minWidth: '100%', height: '1600px', border: 'none' }}
                title="Plausible Analytics"
              />
              <script async src="https://plausible.io/js/embed.host.js" />
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              <BarChart3 className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
              <p className="font-medium mb-1">Dashboard Analitic</p>
              <p className="text-sm">
                Statisticile detaliate vor fi disponibile după integrarea Plausible Analytics.
              </p>
              <p className="text-xs mt-4">
                Folosim Plausible Analytics — fără cookies, compatibil GDPR, fără tracking personal.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Info */}
        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>
            Statisticile sunt generate de{' '}
            <a href="https://plausible.io" target="_blank" rel="noopener noreferrer" className="underline">
              Plausible Analytics
            </a>
            {' '}— analiză web GDPR-friendly, fără cookies, fără tracking personal.
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
