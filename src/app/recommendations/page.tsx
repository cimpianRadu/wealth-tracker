import { Header, Footer } from '@/components/layout/Header';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, Star } from 'lucide-react';
import { getPremiumPartner, getStandardPartners, CATEGORY_COLORS, type Partner } from '@/lib/partners-data';

export const metadata = {
  title: 'Recomandări — Wealth Tracker România',
  description: 'Platforme de investiții și instrumente financiare recomandate pentru piața românească.',
};

function PartnerLogo({ partner, size = 48 }: { partner: Partner; size?: number }) {
  return (
    <div
      className="rounded-xl shrink-0 flex items-center justify-center text-white font-bold"
      style={{
        width: size,
        height: size,
        backgroundColor: partner.color,
        fontSize: size * 0.4,
      }}
    >
      {partner.name[0]}
    </div>
  );
}

export default function RecommendationsPage() {
  const premium = getPremiumPartner();
  const standard = getStandardPartners();

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold mb-2">Recomandări</h1>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Platforme de investiții și instrumente financiare selectate pentru piața românească.
            Linkurile pot fi afiliate.
          </p>
        </div>

        {/* Premium partner — featured card */}
        {premium && (
          <div className="mb-8">
            <a
              href={premium.url}
              target="_blank"
              rel="noopener noreferrer sponsored"
              className="block"
            >
              <Card className="border-2 border-amber-300 bg-gradient-to-r from-amber-50/80 to-amber-50/30 hover:border-amber-400 transition-colors">
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                    <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-amber-200">
                      Recomandat
                    </Badge>
                  </div>
                  <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-5">
                    <PartnerLogo partner={premium} size={64} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold">{premium.name}</h2>
                        <ExternalLink className="h-4 w-4 text-muted-foreground shrink-0" />
                      </div>
                      <Badge
                        variant="secondary"
                        className={`mt-1 text-xs ${CATEGORY_COLORS[premium.category] || ''}`}
                      >
                        {premium.category}
                      </Badge>
                      <p className="text-sm text-muted-foreground mt-3">
                        {premium.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </a>
          </div>
        )}

        {/* Standard partners grid */}
        <div className="grid gap-4 md:grid-cols-2">
          {standard.map((partner) => (
            <a
              key={partner.id}
              href={partner.url}
              target="_blank"
              rel="noopener noreferrer sponsored"
              className="block"
            >
              <Card className="h-full hover:border-primary/50 transition-colors">
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <PartnerLogo partner={partner} size={48} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold">{partner.name}</h3>
                        <ExternalLink className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      </div>
                      <Badge
                        variant="secondary"
                        className={`mt-1 text-xs ${CATEGORY_COLORS[partner.category] || ''}`}
                      >
                        {partner.category}
                      </Badge>
                      <p className="text-sm text-muted-foreground mt-2">
                        {partner.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </a>
          ))}
        </div>

        {/* Contact CTA */}
        <div className="mt-10 text-center">
          <Card className="border-dashed">
            <CardContent className="p-6">
              <h3 className="font-medium mb-1">Vrei să apari aici?</h3>
              <p className="text-sm text-muted-foreground">
                Suntem deschiși la parteneriate cu platforme financiare relevante pentru utilizatorii noștri.
              </p>
              <a
                href="mailto:contact@wealthtracker.ro"
                className="text-sm text-primary hover:underline mt-2 inline-block"
              >
                Contactează-ne pentru parteneriate →
              </a>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}
