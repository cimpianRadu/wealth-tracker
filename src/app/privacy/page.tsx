import { Header, Footer } from '@/components/layout/Header';
import { Card, CardContent } from '@/components/ui/card';
import { Shield, Database, BarChart3, Cookie, Lock } from 'lucide-react';

export const metadata = {
  title: 'Politica de Confidențialitate — Wealth Tracker România',
  description: 'Politica noastră de confidențialitate. Nu colectăm date personale. Toate datele rămân în browser-ul tău.',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-8 max-w-3xl">
        <div className="text-center mb-8">
          <Shield className="h-12 w-12 mx-auto text-primary mb-4" />
          <h1 className="text-3xl font-bold mb-2">Politica de Confidențialitate</h1>
          <p className="text-muted-foreground">
            Suntem transparenți cu privire la datele tale — pentru că nu colectăm niciuna.
          </p>
        </div>

        <div className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                <Database className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                <div>
                  <h2 className="font-semibold text-lg mb-2">Stocare Date</h2>
                  <p className="text-sm text-muted-foreground">
                    Toate datele tale financiare (active, datorii, snapshots) sunt stocate
                    exclusiv în browser-ul tău folosind IndexedDB. Datele nu sunt transmise
                    niciodată către serverele noastre sau către terți.
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Aceasta înseamnă că:
                  </p>
                  <ul className="text-sm text-muted-foreground list-disc pl-5 mt-1 space-y-1">
                    <li>Datele sunt accesibile doar pe dispozitivul și browser-ul unde le-ai introdus</li>
                    <li>Ștergerea datelor browser-ului va șterge și datele din aplicație</li>
                    <li>Recomandăm exportarea regulată a unui backup JSON</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                <BarChart3 className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                <div>
                  <h2 className="font-semibold text-lg mb-2">Analiză Web</h2>
                  <p className="text-sm text-muted-foreground">
                    Folosim Plausible Analytics pentru a înțelege câți vizitatori avem.
                    Plausible este o platformă de analiză web GDPR-friendly care:
                  </p>
                  <ul className="text-sm text-muted-foreground list-disc pl-5 mt-1 space-y-1">
                    <li>Nu folosește cookies</li>
                    <li>Nu colectează date personale</li>
                    <li>Nu urmărește utilizatorii între site-uri</li>
                    <li>Respectă Do Not Track</li>
                  </ul>
                  <p className="text-sm text-muted-foreground mt-2">
                    Statisticile noastre sunt publice pe pagina{' '}
                    <a href="/stats" className="text-primary underline">/stats</a>.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                <Cookie className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                <div>
                  <h2 className="font-semibold text-lg mb-2">Cookies</h2>
                  <p className="text-sm text-muted-foreground">
                    Nu folosim cookies. Punct. Nu este necesar niciun banner de consimțământ
                    pentru cookies deoarece nu setăm cookies pe dispozitivul tău.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                <Lock className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                <div>
                  <h2 className="font-semibold text-lg mb-2">Conformitate GDPR</h2>
                  <p className="text-sm text-muted-foreground">
                    Nu avem conturi de utilizator, nu colectăm date personale, nu procesăm
                    date cu caracter personal. Prin urmare, nu există preocupări GDPR legate
                    de datele utilizatorilor.
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Analiza web (Plausible Analytics) este de asemenea conformă cu GDPR
                    și nu necesită consimțământul utilizatorului.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                <Shield className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                <div>
                  <h2 className="font-semibold text-lg mb-2">Publicitate</h2>
                  <p className="text-sm text-muted-foreground">
                    Afișăm reclame de la parteneri financiari pe site. Aceste reclame:
                  </p>
                  <ul className="text-sm text-muted-foreground list-disc pl-5 mt-1 space-y-1">
                    <li>Nu te urmăresc și nu folosesc cookies</li>
                    <li>Sunt afișate static, nu personalizate pe baza datelor tale</li>
                    <li>Pot conține linkuri afiliate (marcate corespunzător)</li>
                    <li>Nu au acces la datele tale financiare din aplicație</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>Ultima actualizare: {new Date().toLocaleDateString('ro-RO', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
          <p className="mt-1">
            Întrebări? <a href="mailto:contact@wealthtracker.ro" className="text-primary underline">contact@wealthtracker.ro</a>
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
