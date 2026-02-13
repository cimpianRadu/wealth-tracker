import Link from "next/link";
import { Header, Footer } from "@/components/layout/Header";
import { TopBanner } from "@/components/ads/TopBanner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  TrendingUp,
  Shield,
  Zap,
  PieChart,
  ArrowRight,
  Download,
  Lock,
  BarChart3,
  Wallet,
  CreditCard,
} from "lucide-react";

const features = [
  {
    icon: Shield,
    title: "100% Privat",
    description:
      "Toate datele sunt stocate în browser-ul tău (IndexedDB). Nimic nu părăsește dispozitivul tău.",
  },
  {
    icon: Zap,
    title: "Zero Fricțiune",
    description:
      "Fără înregistrare, fără cookies, fără cont. Deschizi pagina și începi.",
  },
  {
    icon: PieChart,
    title: "Vizualizări Complete",
    description:
      "Grafice pie, evoluție lunară, alocare pe categorii — totul într-un singur dashboard.",
  },
  {
    icon: Wallet,
    title: "Multi-Activ",
    description:
      "Acțiuni, crypto, cash, imobiliare, alte active — trackuiește totul într-un singur loc.",
  },
  {
    icon: CreditCard,
    title: "Urmărire Datorii",
    description:
      "Ipoteci, carduri de credit, împrumuturi — vezi averea netă reală.",
  },
  {
    icon: Download,
    title: "Export / Import",
    description:
      "Exportă backup JSON sau CSV oricând. Importă datele pe alt dispozitiv.",
  },
];

const categories = [
  { name: "Acțiuni & Obligațiuni", color: "bg-blue-500" },
  { name: "Crypto", color: "bg-amber-500" },
  { name: "Cash & Conturi Bancare", color: "bg-emerald-500" },
  { name: "Imobiliare", color: "bg-purple-500" },
  { name: "Alte Active", color: "bg-gray-500" },
];

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      {/* Hero */}
      <section className="py-10 sm:py-16 md:py-24 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 px-3 py-1 rounded-full text-sm mb-6">
            <Lock className="h-3.5 w-3.5" />
            100% Privat — Datele rămân în browser-ul tău
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold tracking-tight">
            Controlează-ți Finanțele,
            <br />
            <span className="text-primary">100% Privat</span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground mt-6 max-w-2xl mx-auto">
            Trackuiește acțiuni, crypto, economii și datorii. Fără cont, fără
            cookies, gratuit pentru totdeauna. Datele tale rămân pe dispozitivul
            tău.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8">
            <Link href="/dashboard">
              <Button size="lg" className="text-base px-8">
                <BarChart3 className="h-5 w-5 mr-2" />
                Începe Acum — Gratuit
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>

          <p className="text-xs text-muted-foreground mt-3">
            Nu este nevoie de cont. Începi în 5 secunde.
          </p>

          <div className="mt-10">
            <TopBanner />
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-10">
            Tot ce ai nevoie pentru a-ți urmări averea
          </h2>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <Card key={feature.title}>
                <CardContent className="p-6">
                  <feature.icon className="h-8 w-8 text-primary mb-3" />
                  <h3 className="font-semibold text-lg mb-1">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-4">
            Trackuiește Orice Tip de Activ
          </h2>
          <p className="text-muted-foreground text-center mb-8">
            Suport complet pentru toate categoriile de active și datorii
          </p>

          <div className="flex flex-wrap gap-3 justify-center">
            {categories.map((cat) => (
              <div
                key={cat.name}
                className="flex items-center gap-2 px-4 py-2 rounded-full border bg-card"
              >
                <div className={`w-3 h-3 rounded-full ${cat.color}`} />
                <span className="text-sm font-medium">{cat.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Multi-Currency */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            Suport Multi-Monedă
          </h2>
          <p className="text-muted-foreground mb-8">
            Adaugă active în RON, EUR sau USD. Convertire automată cu cursuri de
            schimb configurabile.
          </p>
          <div className="flex justify-center gap-4">
            {["RON", "EUR", "USD"].map((cur) => (
              <div
                key={cur}
                className="flex items-center justify-center w-20 h-20 rounded-full border-2 border-primary/20 bg-card font-bold text-lg"
              >
                {cur}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Privacy CTA */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-3xl">
          <Card className="bg-gradient-to-r from-blue-600 to-blue-800 text-white border-0">
            <CardContent className="p-8 text-center">
              <Shield className="h-12 w-12 mx-auto mb-4 text-blue-200" />
              <h2 className="text-2xl font-bold mb-2">
                Datele Tale. Doar ale Tale.
              </h2>
              <p className="text-blue-100 mb-6 max-w-lg mx-auto">
                Nu avem servere, nu colectăm date, nu există conturi. Totul este
                stocat local în browser-ul tău. Exportă un backup oricând.
              </p>
              <Link href="/dashboard">
                <Button size="lg" variant="secondary" className="text-base">
                  <TrendingUp className="h-5 w-5 mr-2" />
                  Începe Gratuit Acum
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </section>

      <Footer />
    </div>
  );
}
