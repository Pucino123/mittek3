import { PublicLayout } from '@/components/layout/PublicLayout';
import { Card, CardContent } from '@/components/ui/card';
import { 
  FileText, 
  CheckCircle, 
  XCircle, 
  CreditCard, 
  RefreshCw, 
  AlertTriangle,
  Scale,
  Mail
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { SEOHead } from '@/components/seo/SEOHead';

const Terms = () => {
  const sections = [
    {
      icon: FileText,
      title: '1. Generelle vilkår',
      content: `Ved at oprette en konto hos MitTek accepterer du disse vilkår og betingelser. 
      MitTek er en digital tjeneste, der hjælper seniorer med at bruge teknologi trygt og sikkert.
      
      Tjenesten er beregnet til privat, ikke-kommercielt brug. Du skal være mindst 18 år for at oprette en konto.
      
      Vi forbeholder os retten til at opdatere disse vilkår. Ved væsentlige ændringer vil vi give dig besked via e-mail mindst 30 dage før ændringerne træder i kraft.`,
    },
    {
      icon: CheckCircle,
      title: '2. Hvad du må',
      content: `Som bruger af MitTek må du:
      
      • **Bruge tjenesten** til personlig læring og hjælp med teknologi
      • **Gemme dine koder** sikkert i Kode-mappen (Plus-abonnement)
      • **Kontakte support** ved spørgsmål eller problemer
      • **Invitere en hjælper** til at følge med i din tekniske sundhed
      • **Eksportere dine data** når som helst
      • **Opsige dit abonnement** med øjeblikkelig virkning`,
    },
    {
      icon: XCircle,
      title: '3. Hvad du ikke må',
      content: `Du må IKKE:
      
      • **Dele din konto** med andre personer
      • **Videresælge adgang** til tjenesten
      • **Misbruge supporten** til formål, der ikke vedrører teknisk hjælp
      • **Uploade ulovligt indhold** eller indhold, der krænker andres rettigheder
      • **Forsøge at hacke** eller manipulere med tjenesten
      • **Bruge automatiserede værktøjer** til at tilgå tjenesten
      
      Overtrædelse kan medføre øjeblikkelig lukning af din konto uden refusion.`,
    },
    {
      icon: CreditCard,
      title: '4. Abonnement og betaling',
      content: `**Priser og planer:**
      • Basic: 39 kr./måned
      • Plus: 79 kr./måned
      • Pro: 99 kr./måned
      
      **Betalingsvilkår:**
      • Betaling sker forud hver måned via Stripe
      • Priser er inkl. moms
      • Ved manglende betaling suspenderes adgangen efter 7 dage
      
      **Prisændringer:**
      Vi kan ændre priserne med 30 dages varsel. Du kan altid opsige inden ændringen træder i kraft.`,
    },
    {
      icon: RefreshCw,
      title: '5. Fortrydelsesret og refusion',
      content: `**14 dages fortrydelsesret:**
      Som forbruger har du ret til at fortryde dit køb inden for 14 dage fra tilmeldingsdatoen.
      
      **Sådan fortryder du:**
      Kontakt os på mittek@webilax.com med dit fulde navn og e-mail.
      
      **Refusion:**
      Ved fortrydelse refunderer vi det fulde beløb inden for 14 dage.
      
      **Efter fortrydelsesfristen:**
      Du kan stadig opsige dit abonnement når som helst, men der gives ikke refusion for allerede betalt periode.`,
    },
    {
      icon: AlertTriangle,
      title: '6. Ansvarsbegrænsning',
      content: `**Tjenestens formål:**
      MitTek tilbyder vejledning og guides til brug af teknologi. Vi erstatter IKKE professionel IT-support eller rådgivning.
      
      **Vi er IKKE ansvarlige for:**
      • Tab af data, som du ikke har sikkerhedskopieret
      • Skader forårsaget af at følge vores guides forkert
      • Tredjepartstjenester (Apple, Google, banker mv.)
      • Tekniske nedbrud hos vores hostingudbydere
      
      **Vores ansvar er begrænset til:**
      Det beløb, du har betalt for tjenesten i de seneste 12 måneder.`,
    },
    {
      icon: Scale,
      title: '7. Tvister og lovvalg',
      content: `**Lovvalg:**
      Disse vilkår er underlagt dansk ret.
      
      **Tvistløsning:**
      Vi opfordrer til, at vi først forsøger at løse eventuelle uenigheder direkte. 
      Kontakt os på mittek@webilax.com.
      
      **Klageadgang:**
      Du kan klage til Forbrugerklagenævnet:
      www.forbrug.dk
      
      **Værneting:**
      Eventuelle retssager anlægges ved Københavns Byret.`,
    },
  ];

  return (
    <PublicLayout>
      <SEOHead
        title="Vilkår og betingelser - MitTek"
        description="Læs MitTeks vilkår og betingelser. Ingen binding, 14 dages fortrydelsesret, og dine data tilhører dig."
        canonical="https://www.mittek.dk/terms"
      />
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
        {/* Header */}
        <div className="bg-primary/5 border-b border-border">
          <div className="container mx-auto px-4 py-12 md:py-16">
            <div className="max-w-3xl mx-auto text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-6">
                <FileText className="w-8 h-8 text-primary" />
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Vilkår og betingelser
              </h1>
              <p className="text-lg text-muted-foreground">
                Her finder du de vilkår, der gælder for din brug af MitTek.
              </p>
              <p className="text-sm text-muted-foreground mt-4">
                Sidst opdateret: Januar 2026
              </p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-3xl mx-auto space-y-6">
            {/* Quick Summary */}
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="p-6">
                <h2 className="font-semibold text-lg mb-3">Kort fortalt</h2>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>Du kan opsige når som helst uden binding</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>14 dages fortrydelsesret med fuld refusion</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>Dine data tilhører dig og kan eksporteres</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>Vi sælger aldrig dine oplysninger</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

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
                      <div className="text-muted-foreground whitespace-pre-line leading-relaxed">
                        {section.content.split('**').map((part, i) => 
                          i % 2 === 1 ? <strong key={i} className="text-foreground">{part}</strong> : part
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Contact Section */}
            <Card className="border-primary/20 bg-primary/5 mt-8">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Mail className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-foreground mb-2">
                      Har du spørgsmål?
                    </h2>
                    <p className="text-muted-foreground mb-4">
                      Er der noget i vilkårene, du er i tvivl om, er du velkommen til at kontakte os:
                    </p>
                    <div className="space-y-2 text-sm">
                      <p className="text-foreground">
                        <strong>E-mail:</strong> mittek@webilax.com
                      </p>
                      <p className="text-muted-foreground">
                        Vi svarer normalt inden for 1-2 hverdage.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Related Links */}
            <div className="text-center pt-4 space-y-2">
              <p className="text-sm text-muted-foreground">
                Se også vores{' '}
                <Link to="/privacy" className="text-primary hover:underline">
                  privatlivspolitik
                </Link>
                {' '}for information om, hvordan vi behandler dine personoplysninger.
              </p>
            </div>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
};

export default Terms;
