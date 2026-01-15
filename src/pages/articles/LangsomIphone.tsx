import { Link } from 'react-router-dom';
import { PublicLayout } from '@/components/layout/PublicLayout';
import { SEOHead, breadcrumbSchema } from '@/components/seo/SEOHead';
import { ChevronLeft, Smartphone, RefreshCw, HardDrive, Download, Globe, Settings, Lightbulb } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const LangsomIphone = () => {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Article',
        'headline': '5 ting du skal gøre, hvis din iPhone er langsom',
        'description': 'Simple trin der kan få din iPhone til at køre hurtigt igen. Lær at genstarte, frigøre plads, opdatere iOS og mere.',
        'datePublished': '2026-01-15',
        'dateModified': '2026-01-15',
        'author': { '@type': 'Organization', 'name': 'MitTek' },
        'publisher': { '@type': 'Organization', 'name': 'MitTek', 'logo': { '@type': 'ImageObject', 'url': 'https://www.mittek.dk/favicon.svg' } },
        'mainEntityOfPage': 'https://www.mittek.dk/viden/langsom-iphone',
        'inLanguage': 'da-DK',
      },
      breadcrumbSchema([
        { name: 'Forside', url: 'https://www.mittek.dk/' },
        { name: 'Gratis Tips', url: 'https://www.mittek.dk/viden' },
        { name: 'Langsom iPhone', url: 'https://www.mittek.dk/viden/langsom-iphone' },
      ]),
    ],
  };

  const tips = [
    {
      number: 1,
      title: 'Genstart din iPhone',
      icon: <RefreshCw className="h-6 w-6" />,
      description: 'Det klassiske trick virker faktisk. En genstart rydder hukommelsen og lukker programmer, der kører i baggrunden.',
      steps: [
        'Hold side-knappen og en lydstyrkeknap nede samtidig',
        'Træk skyderen for at slukke',
        'Vent 30 sekunder, tænd igen ved at holde side-knappen nede',
      ],
    },
    {
      number: 2,
      title: 'Frigør plads på din iPhone',
      icon: <HardDrive className="h-6 w-6" />,
      description: 'Når din iPhone er næsten fyldt op, bliver den langsom. Du bør have mindst 5-10 GB fri plads.',
      steps: [
        'Gå til Indstillinger → Generelt → iPhone-lagring',
        'Se hvilke apps der fylder mest',
        'Slet gamle videoer, apps du ikke bruger, eller flyt billeder til iCloud',
      ],
    },
    {
      number: 3,
      title: 'Opdater iOS',
      icon: <Download className="h-6 w-6" />,
      description: 'Apple retter fejl og forbedrer hastigheden med hver opdatering. Sørg for at have den nyeste version.',
      steps: [
        'Gå til Indstillinger → Generelt → Softwareopdatering',
        'Hvis der er en opdatering, tryk "Hent og installer"',
        'Sørg for at have mindst 50% batteri eller være tilsluttet strøm',
      ],
    },
    {
      number: 4,
      title: 'Luk faner i Safari',
      icon: <Globe className="h-6 w-6" />,
      description: 'Mange åbne faner bruger hukommelse og kan gøre din iPhone langsom – især hvis du har 50+ faner åbne.',
      steps: [
        'Åbn Safari',
        'Tryk og hold på fane-ikonet nederst til højre',
        'Vælg "Luk alle [X] faner"',
      ],
    },
    {
      number: 5,
      title: 'Slå "Opdater i baggrunden" fra',
      icon: <Settings className="h-6 w-6" />,
      description: 'Mange apps opdaterer sig selv i baggrunden, hvilket bruger strøm og kan gøre telefonen langsom.',
      steps: [
        'Gå til Indstillinger → Generelt → Opdater i baggrunden',
        'Slå det fra for apps, du ikke bruger dagligt',
        'Du kan også slå det helt fra og kun tillade via Wi-Fi',
      ],
    },
  ];

  return (
    <PublicLayout>
      <SEOHead
        title="5 ting du skal gøre, hvis din iPhone er langsom | MitTek"
        description="Simple trin der kan få din iPhone til at køre hurtigt igen. Lær at genstarte, frigøre plads, opdatere iOS og mere."
        canonical="https://www.mittek.dk/viden/langsom-iphone"
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
              <Smartphone className="h-6 w-6" />
            </div>
            <span className="text-sm text-muted-foreground">iPhone Tips • 4 min læsetid</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-4 leading-tight">
            5 ting du skal gøre, hvis din iPhone er langsom
          </h1>
          <p className="text-lg text-muted-foreground">
            En langsom iPhone er frustrerende – men heldigvis kan du ofte selv løse problemet. 
            Her er 5 simple ting, du kan prøve, før du overvejer at købe ny telefon.
          </p>
        </header>

        {/* Tips List */}
        <div className="space-y-8">
          {tips.map((tip) => (
            <section 
              key={tip.number} 
              className="bg-card border border-border rounded-2xl p-6 md:p-8"
            >
              <div className="flex items-start gap-4 mb-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold text-xl shrink-0">
                  {tip.number}
                </div>
                <div>
                  <h2 className="text-xl md:text-2xl font-semibold flex items-center gap-3">
                    {tip.title}
                  </h2>
                  <p className="text-muted-foreground mt-2">
                    {tip.description}
                  </p>
                </div>
              </div>

              <div className="ml-0 md:ml-16 mt-4">
                <p className="text-sm font-medium text-foreground mb-3">Sådan gør du:</p>
                <ol className="space-y-2">
                  {tip.steps.map((step, index) => (
                    <li key={index} className="flex items-start gap-3 text-muted-foreground">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-medium shrink-0">
                        {index + 1}
                      </span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </section>
          ))}
        </div>

        {/* Pro Tip */}
        <Alert className="my-10 border-primary/30 bg-primary/5">
          <Lightbulb className="h-5 w-5 text-primary" />
          <AlertDescription className="text-base">
            <strong>Ekstra tip:</strong> Hvis din iPhone stadig er langsom efter disse trin, 
            kan du prøve vores <Link to="/hardware-detective" className="text-primary hover:underline font-medium">Hardware Detektiv</Link> for 
            at finde ud af, om der er et større problem.
          </AlertDescription>
        </Alert>

        {/* Summary Box */}
        <div className="bg-muted/50 border border-border rounded-2xl p-6 md:p-8 my-8">
          <h2 className="text-xl font-semibold mb-4">Opsummering</h2>
          <ol className="space-y-2">
            {tips.map((tip) => (
              <li key={tip.number} className="flex items-center gap-3">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-semibold">
                  {tip.number}
                </span>
                <span className="text-muted-foreground">{tip.title}</span>
              </li>
            ))}
          </ol>
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

export default LangsomIphone;
