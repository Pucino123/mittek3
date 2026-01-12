import { PublicLayout } from '@/components/layout/PublicLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Shield, Cookie, Eye, Trash2, Download, Mail, Clock, Server } from 'lucide-react';
import { SEOHead } from '@/components/seo/SEOHead';

const Privacy = () => {
  const sections = [
    {
      icon: Shield,
      title: 'Hvem er vi?',
      content: `MitTek er en dansk tjeneste, der hjælper seniorer med at bruge teknologi trygt og sikkert. 
      Vi tager dit privatliv alvorligt og behandler dine personoplysninger i overensstemmelse med gældende lovgivning, 
      herunder EU's Generelle Databeskyttelsesforordning (GDPR).`,
    },
    {
      icon: Server,
      title: 'Hvilke data indsamler vi?',
      content: `Vi indsamler kun de oplysninger, der er nødvendige for at levere vores tjenester:
      
      • **Kontooplysninger**: E-mail, navn og adgangskode (krypteret)
      • **Enhedspræferencer**: Hvilken type enhed du bruger (iPhone, iPad, Mac)
      • **Brugsdata**: Hvilke guides du læser og værktøjer du bruger
      • **Check-in data**: Dine månedlige check-in besvarelser
      • **Supporthenvendelser**: Beskeder du sender til vores support
      
      Vi indsamler IKKE følsomme personoplysninger som helbredsdata, religiøs overbevisning eller politisk tilhørsforhold.`,
    },
    {
      icon: Eye,
      title: 'Hvorfor indsamler vi data?',
      content: `Vi bruger dine oplysninger til at:
      
      • **Levere tjenesten**: Vise dig relevante guides til din enhed
      • **Forbedre oplevelsen**: Huske dine præferencer og fremskridt
      • **Yde support**: Besvare dine henvendelser og hjælpe dig
      • **Sikre din konto**: Beskytte mod uautoriseret adgang
      • **Sende påmindelser**: Månedlige check-in påmindelser (kan slås fra)
      
      Vi sælger ALDRIG dine data til tredjeparter eller bruger dem til reklamer.`,
    },
    {
      icon: Cookie,
      title: 'Cookies og lignende teknologier',
      content: `Vi bruger cookies til at:
      
      • **Holde dig logget ind**: Så du ikke skal indtaste adgangskode hver gang
      • **Huske dine valg**: F.eks. om du foretrækker stor tekst
      • **Forbedre tjenesten**: Anonyme statistikker om hvilke funktioner der bruges mest
      
      **Typer af cookies:**
      • **Nødvendige cookies**: Kræves for at tjenesten fungerer (kan ikke slås fra)
      • **Præference-cookies**: Husker dine indstillinger
      • **Statistik-cookies**: Hjælper os med at forbedre tjenesten (kun med dit samtykke)
      
      Du kan altid ændre dine cookie-indstillinger via banneret eller i dine kontoindstillinger.`,
    },
    {
      icon: Clock,
      title: 'Hvor længe gemmer vi dine data?',
      content: `• **Kontodata**: Så længe du har en aktiv konto hos os
      • **Supportbeskeder**: Op til 2 år efter henvendelsen er løst
      • **Check-in historik**: Op til 12 måneder
      • **Logfiler**: Maksimalt 30 dage
      
      Når du sletter din konto, fjerner vi alle dine personlige data inden for 30 dage.`,
    },
  ];

  const rights = [
    {
      icon: Eye,
      title: 'Ret til indsigt',
      description: 'Du kan til enhver tid bede om at se, hvilke oplysninger vi har om dig.',
    },
    {
      icon: Download,
      title: 'Ret til dataportabilitet',
      description: 'Du kan få en kopi af dine data i et maskinlæsbart format.',
    },
    {
      icon: Trash2,
      title: 'Ret til sletning',
      description: 'Du kan bede os om at slette alle dine personoplysninger ("retten til at blive glemt").',
    },
    {
      icon: Shield,
      title: 'Ret til begrænsning',
      description: 'Du kan bede os om at begrænse behandlingen af dine data i visse situationer.',
    },
  ];

  return (
    <PublicLayout>
      <SEOHead
        title="Privatlivspolitik - MitTek"
        description="Læs om hvordan MitTek behandler dine personlige oplysninger. Vi passer godt på dine data og følger GDPR."
        canonical="https://www.mittek.dk/privacy"
      />
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
        {/* Header */}
        <div className="bg-primary/5 border-b border-border">
          <div className="container mx-auto px-4 py-12 md:py-16">
            <div className="max-w-3xl mx-auto text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-6">
                <Shield className="w-8 h-8 text-primary" />
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Privatlivspolitik
              </h1>
              <p className="text-lg text-muted-foreground">
                Hos MitTek passer vi godt på dine personlige oplysninger. 
                Her kan du læse om, hvordan vi behandler dine data.
              </p>
              <p className="text-sm text-muted-foreground mt-4">
                Sidst opdateret: Januar 2026
              </p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-3xl mx-auto space-y-8">
            {/* Main Sections */}
            {sections.map((section, index) => (
              <Card key={index} className="border-border/50">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                      <section.icon className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h2 className="text-xl font-semibold text-foreground mb-3">
                        {section.title}
                      </h2>
                      <div className="text-muted-foreground whitespace-pre-line leading-relaxed prose-sm">
                        {section.content.split('**').map((part, i) => 
                          i % 2 === 1 ? <strong key={i} className="text-foreground">{part}</strong> : part
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Your Rights Section */}
            <div className="pt-8">
              <h2 className="text-2xl font-bold text-foreground mb-6 text-center">
                Dine rettigheder
              </h2>
              <p className="text-muted-foreground text-center mb-8">
                I henhold til GDPR har du en række rettigheder vedrørende dine personoplysninger:
              </p>
              <div className="grid md:grid-cols-2 gap-4">
                {rights.map((right, index) => (
                  <Card key={index} className="border-border/50">
                    <CardContent className="p-5">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                          <right.icon className="w-4 h-4 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground mb-1">{right.title}</h3>
                          <p className="text-sm text-muted-foreground">{right.description}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Contact Section */}
            <Card className="border-primary/20 bg-primary/5 mt-8">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Mail className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-foreground mb-2">
                      Kontakt os
                    </h2>
                    <p className="text-muted-foreground mb-4">
                      Har du spørgsmål til vores behandling af dine personoplysninger, 
                      eller ønsker du at gøre brug af dine rettigheder, er du velkommen til at kontakte os:
                    </p>
                    <div className="space-y-2 text-sm">
                      <p className="text-foreground">
                        <strong>E-mail:</strong> mittek@webilax.com
                      </p>
                      <p className="text-muted-foreground">
                        Vi bestræber os på at besvare henvendelser inden for 30 dage.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Complaint Section */}
            <div className="text-center text-sm text-muted-foreground pt-4">
              <p>
                Hvis du mener, at vi ikke behandler dine personoplysninger korrekt, 
                har du ret til at klage til Datatilsynet:{' '}
                <a 
                  href="https://www.datatilsynet.dk" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  www.datatilsynet.dk
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
};

export default Privacy;
