import { Link } from 'react-router-dom';
import { PublicLayout } from '@/components/layout/PublicLayout';
import { SEOHead, breadcrumbSchema } from '@/components/seo/SEOHead';
import { ChevronLeft, Lock, CheckCircle2, XCircle, Lightbulb } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const SikkerAdgangskode = () => {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Article',
        'headline': 'Sådan laver du en sikker adgangskode, du kan huske',
        'description': 'Lær den nemmeste måde at lave stærke adgangskoder på – uden at skulle huske tilfældige tegn. En simpel guide til at beskytte dine konti.',
        'datePublished': '2026-01-15',
        'dateModified': '2026-01-15',
        'author': { '@type': 'Organization', 'name': 'MitTek' },
        'publisher': { '@type': 'Organization', 'name': 'MitTek', 'logo': { '@type': 'ImageObject', 'url': 'https://www.mittek.dk/favicon.svg' } },
        'mainEntityOfPage': 'https://www.mittek.dk/viden/sikker-adgangskode',
        'inLanguage': 'da-DK',
      },
      breadcrumbSchema([
        { name: 'Forside', url: 'https://www.mittek.dk/' },
        { name: 'Gratis Tips', url: 'https://www.mittek.dk/viden' },
        { name: 'Sikker adgangskode', url: 'https://www.mittek.dk/viden/sikker-adgangskode' },
      ]),
    ],
  };

  return (
    <PublicLayout>
      <SEOHead
        title="Sådan laver du en sikker adgangskode, du kan huske | MitTek"
        description="Lær den nemmeste måde at lave stærke adgangskoder på – uden at skulle huske tilfældige tegn. En simpel guide til at beskytte dine konti."
        canonical="https://www.mittek.dk/viden/sikker-adgangskode"
        jsonLd={jsonLd}
      />

      <article className="container py-8 md:py-12 px-4 max-w-3xl mx-auto">
        {/* Back link */}
        <Link 
          to="/viden" 
          className="inline-flex items-center gap-2 text-primary hover:underline mb-8"
        >
          <ChevronLeft className="h-4 w-4" />
          Tilbage til alle tips
        </Link>

        {/* Article Header */}
        <header className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Lock className="h-6 w-6" />
            </div>
            <span className="text-sm text-muted-foreground">Sikkerhed • 3 min læsetid</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-4 leading-tight">
            Sådan laver du en sikker adgangskode, du kan huske
          </h1>
          <p className="text-lg text-muted-foreground">
            Glem alt om komplicerede koder med tal og symboler. Der er en nemmere – og faktisk mere sikker – måde at beskytte dine konti på.
          </p>
        </header>

        {/* Article Content */}
        <div className="prose prose-lg max-w-none">
          <h2 className="text-2xl font-semibold mt-8 mb-4 flex items-center gap-3">
            <Lightbulb className="h-6 w-6 text-primary" />
            Længde slår kompleksitet
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-6">
            Det vigtigste ved en god adgangskode er ikke, hvor mange mærkelige tegn den indeholder – 
            det er, <strong>hvor lang den er</strong>. En kode på 20 tegn er langt sværere at gætte 
            end en kort kode med symboler.
          </p>
          <p className="text-muted-foreground leading-relaxed mb-6">
            Problemet med korte, komplekse koder som <code className="bg-muted px-2 py-1 rounded">P@ssw0rd!</code> er, 
            at hackere kender alle de typiske substitutioner (@ for a, 0 for o, osv.). 
            Så de er slet ikke så sikre, som de ser ud til.
          </p>

          <h2 className="text-2xl font-semibold mt-10 mb-4">
            Brug en "passphrase" – 3 tilfældige ord
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-6">
            Den bedste metode er at bruge en <strong>passphrase</strong>: Tre eller fire tilfældige ord 
            sat sammen til én lang kode. For eksempel:
          </p>
          
          <div className="bg-muted/50 border border-border rounded-xl p-6 my-6">
            <p className="text-xl font-mono text-center font-semibold text-foreground">
              hund-paraply-sommer-kaffe
            </p>
            <p className="text-center text-sm text-muted-foreground mt-3">
              24 tegn – nem at huske, svær at gætte
            </p>
          </div>

          <p className="text-muted-foreground leading-relaxed mb-6">
            Forestil dig et billede af en hund med en paraply, der drikker kaffe om sommeren. 
            Det er nemt at huske, men næsten umuligt for en computer at gætte.
          </p>

          <h2 className="text-2xl font-semibold mt-10 mb-4 flex items-center gap-3">
            <XCircle className="h-6 w-6 text-destructive" />
            Undgå disse typiske fejl
          </h2>
          <div className="space-y-3 mb-8">
            <div className="flex items-start gap-3 p-4 bg-destructive/5 border border-destructive/20 rounded-lg">
              <XCircle className="h-5 w-5 text-destructive mt-0.5 shrink-0" />
              <div>
                <strong className="text-foreground">Fødselsdage og navne</strong>
                <p className="text-muted-foreground text-sm mt-1">
                  "Ole1956" er nemt at gætte – især med lidt research på sociale medier.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 bg-destructive/5 border border-destructive/20 rounded-lg">
              <XCircle className="h-5 w-5 text-destructive mt-0.5 shrink-0" />
              <div>
                <strong className="text-foreground">Almindelige koder</strong>
                <p className="text-muted-foreground text-sm mt-1">
                  "123456", "password" og "qwerty" er blandt de mest hackede koder i verden.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 bg-destructive/5 border border-destructive/20 rounded-lg">
              <XCircle className="h-5 w-5 text-destructive mt-0.5 shrink-0" />
              <div>
                <strong className="text-foreground">Samme kode alle steder</strong>
                <p className="text-muted-foreground text-sm mt-1">
                  Hvis én tjeneste bliver hacket, får hackere adgang til alle dine konti.
                </p>
              </div>
            </div>
          </div>

          <h2 className="text-2xl font-semibold mt-10 mb-4 flex items-center gap-3">
            <CheckCircle2 className="h-6 w-6 text-success" />
            Sådan gør du i praksis
          </h2>
          <ol className="space-y-4 mb-8">
            <li className="flex items-start gap-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-semibold shrink-0">1</span>
              <div>
                <strong className="text-foreground">Vælg 3-4 tilfældige ord</strong>
                <p className="text-muted-foreground text-sm mt-1">
                  Ord der ikke naturligt hører sammen, men som du kan visualisere.
                </p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-semibold shrink-0">2</span>
              <div>
                <strong className="text-foreground">Sæt dem sammen med bindestreger</strong>
                <p className="text-muted-foreground text-sm mt-1">
                  Det gør koden længere og nemmere at læse.
                </p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-semibold shrink-0">3</span>
              <div>
                <strong className="text-foreground">Lav en unik kode til hver vigtig konto</strong>
                <p className="text-muted-foreground text-sm mt-1">
                  I det mindste til bank, email og Apple ID.
                </p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-semibold shrink-0">4</span>
              <div>
                <strong className="text-foreground">Skriv dem ned et sikkert sted</strong>
                <p className="text-muted-foreground text-sm mt-1">
                  Det er bedre at have en stærk kode skrevet ned end en svag kode i hovedet.
                </p>
              </div>
            </li>
          </ol>

          <Alert className="my-8 border-primary/30 bg-primary/5">
            <Lightbulb className="h-5 w-5 text-primary" />
            <AlertDescription className="text-base">
              <strong>Tip fra MitTek:</strong> Brug vores <Link to="/password-generator" className="text-primary hover:underline font-medium">gratis kode-generator</Link> til 
              at få forslag til sikre passphrases, du nemt kan huske.
            </AlertDescription>
          </Alert>
        </div>

        {/* Article Footer */}
        <footer className="mt-12 pt-8 border-t border-border">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <Link 
              to="/viden" 
              className="text-primary hover:underline font-medium"
            >
              ← Se flere tips
            </Link>
            <Link 
              to="/signup" 
              className="btn-primary"
            >
              Prøv MitTek gratis
            </Link>
          </div>
        </footer>
      </article>
    </PublicLayout>
  );
};

export default SikkerAdgangskode;
