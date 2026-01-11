import { PublicLayout } from '@/components/layout/PublicLayout';
import { SEOHead, faqSchema } from '@/components/seo/SEOHead';
import { Breadcrumb, generateBreadcrumbSchema } from '@/components/seo/Breadcrumb';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { HelpCircle, MessageCircle, Shield, CreditCard, Users, Lock, Smartphone, ArrowRight } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

// Comprehensive FAQ data organized by category
const faqCategories = [
  {
    title: 'Om MitTek',
    icon: Shield,
    faqs: [
      {
        question: 'Hvad er MitTek?',
        answer: 'MitTek er en dansk tjeneste for alle, der kan have lidt svært ved teknologi - uanset alder. Vi hjælper dig med at bruge iPhone, iPad og Mac trygt og sikkert gennem letforståelige guides, sikkerhedsværktøjer og personlig support. Alt sammen på dansk og tilpasset dit tempo.',
      },
      {
        question: 'Er MitTek tilknyttet Apple?',
        answer: 'Nej, MitTek er en uafhængig dansk virksomhed og er ikke tilknyttet Apple Inc. Vi er specialiseret i at hjælpe med Apple-produkter, men vi er ikke en officiel Apple-partner.',
      },
      {
        question: 'Hvem er MitTek for?',
        answer: 'MitTek er for alle, der ønsker en tryggere og mere overskuelig hverdag med teknologi. Det kan være seniorer, der vil lære i deres eget tempo, eller hvem som helst der synes teknologi kan være forvirrende. Vores guides er skrevet i et klart sprog uden unødvendig teknik-jargon.',
      },
    ],
  },
  {
    title: 'Priser & Abonnement',
    icon: CreditCard,
    faqs: [
      {
        question: 'Hvad koster MitTek?',
        answer: 'Vi har tre planer: Basic (39 kr./md) med adgang til alle guides og Din Digitale Hjælper, Plus (79 kr./md) som inkluderer Kode-mappe, Screenshot AI og sikkerhedsværktøjer, og Pro (99 kr./md) med prioriteret support og 2 månedlige support-henvendelser. Du kan opsige når som helst uden binding.',
      },
      {
        question: 'Kan jeg prøve MitTek gratis?',
        answer: 'Ja! Du har 14 dages fortrydelsesret med fuld refusion. Opret en konto, prøv tjenesten, og hvis du ikke er tilfreds, får du pengene tilbage - ingen spørgsmål stillet.',
      },
      {
        question: 'Hvordan opsiger jeg mit abonnement?',
        answer: 'Du kan opsige dit abonnement når som helst fra Indstillinger → Abonnement i din MitTek-konto. Der er ingen binding, og du har adgang til tjenesten resten af den betalte periode.',
      },
      {
        question: 'Hvilke betalingsmetoder accepterer I?',
        answer: 'Vi accepterer alle gængse betalingskort (Visa, Mastercard, Dankort) via vores betalingspartner Stripe. Din betaling er sikker og krypteret.',
      },
    ],
  },
  {
    title: 'Funktioner',
    icon: Smartphone,
    faqs: [
      {
        question: 'Hvad er Kode-mappen?',
        answer: 'Kode-mappen er et sikkert, krypteret sted hvor du kan gemme dine adgangskoder, pinkoder og andre vigtige oplysninger. Alt er beskyttet med stærk kryptering, så kun du kan se indholdet. Funktionen er inkluderet i Plus og Pro abonnementerne.',
      },
      {
        question: 'Hvad er Din Digitale Hjælper?',
        answer: 'Din Digitale Hjælper er din personlige tekniske assistent, der er tilgængelig døgnet rundt. Du kan stille spørgsmål på dansk og få enkle, letforståelige svar om din iPhone, iPad, Mac eller andre tekniske emner. Din Digitale Hjælper er inkluderet i alle abonnementer.',
      },
      {
        question: 'Hvordan fungerer den månedlige check-in?',
        answer: 'Hver måned får du en påmindelse om at lave et hurtigt "sundhedstjek" af din enhed. Vi stiller et par simple spørgsmål og giver dig personlige anbefalinger baseret på dine svar. Det tager kun 2-3 minutter og hjælper dig med at holde din enhed sikker og velfungerende.',
      },
      {
        question: 'Hvad er Tryghedsknappen?',
        answer: 'Tryghedsknappen er en panik-funktion til Plus og Pro abonnenter. Hvis du oplever noget mistænkeligt - f.eks. en underlig besked eller et opkald fra "banken" - kan du trykke på Tryghedsknappen og få øjeblikkelig vejledning om, hvad du skal gøre.',
      },
    ],
  },
  {
    title: 'Familie & Hjælpere',
    icon: Users,
    faqs: [
      {
        question: 'Kan min familie hjælpe mig gennem MitTek?',
        answer: 'Ja! Med "Betroet Hjælper"-funktionen kan du invitere et familiemedlem til at følge med i din tekniske sundhed. De kan se dine check-ins og hjælpe dig på afstand - helt sikkert og privat. Du bestemmer selv, hvad de kan se.',
      },
      {
        question: 'Hvad kan en Betroet Hjælper se?',
        answer: 'Du vælger selv, hvad din hjælper kan se. Det kan inkludere dine månedlige check-in resultater, dine support-henvendelser og dit dashboard. De kan ALDRIG se indholdet i din Kode-mappe eller andre private oplysninger.',
      },
      {
        question: 'Kan jeg fjerne en Betroet Hjælper igen?',
        answer: 'Ja, du kan til enhver tid fjerne en Betroet Hjælper fra dine indstillinger. De mister øjeblikkeligt adgang til at se dine oplysninger.',
      },
    ],
  },
  {
    title: 'Sikkerhed & Privatliv',
    icon: Lock,
    faqs: [
      {
        question: 'Er mine data sikre hos MitTek?',
        answer: 'Absolut. Vi bruger bankniveau-kryptering til alle følsomme data, og vi sælger ALDRIG dine oplysninger til tredjeparter. Kode-mappen bruger end-to-end kryptering, hvilket betyder at selv vi ikke kan se dine gemte koder.',
      },
      {
        question: 'Hvordan beskytter MitTek mig mod svindel?',
        answer: 'MitTek har flere sikkerhedsfunktioner: Tryghedsknappen giver øjeblikkelig hjælp ved mistanke om svindel, vores guides lærer dig at genkende phishing, og Din Digitale Hjælper kan hjælpe dig med at vurdere, om en besked er ægte eller falsk.',
      },
      {
        question: 'Kan jeg slette min konto og alle data?',
        answer: 'Ja, du kan når som helst slette din konto fra Indstillinger. Vi sletter alle dine personlige data inden for 30 dage i henhold til GDPR. Du kan også eksportere dine data før sletning.',
      },
    ],
  },
];

// Flatten all FAQs for schema
const allFaqs = faqCategories.flatMap(cat => cat.faqs);

const FAQ = () => {
  const location = useLocation();
  const combinedSchema = {
    '@context': 'https://schema.org',
    '@graph': [
      faqSchema(allFaqs),
      generateBreadcrumbSchema(location.pathname),
    ],
  };

  return (
    <PublicLayout>
      <SEOHead
        title="Ofte stillede spørgsmål - MitTek"
        description="Få svar på de mest almindelige spørgsmål om MitTek. Læs om priser, funktioner, sikkerhed og hvordan vi hjælper dig med teknologi."
        canonical="https://www.mittek.dk/faq"
        jsonLd={combinedSchema}
      />
      
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
        {/* Header */}
        <div className="bg-primary/5 border-b border-border">
          <div className="container mx-auto px-4 py-12 md:py-16">
            <div className="max-w-3xl mx-auto text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-6">
                <HelpCircle className="w-8 h-8 text-primary" />
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Ofte stillede spørgsmål
              </h1>
              <p className="text-lg text-muted-foreground">
                Find svar på de mest almindelige spørgsmål om MitTek, vores funktioner og hvordan vi kan hjælpe dig
              </p>
            </div>
          </div>
        </div>

        {/* FAQ Content */}
        <div className="container mx-auto px-4 py-12">
          {/* Breadcrumb Navigation */}
          <div className="max-w-4xl mx-auto mb-8">
            <Breadcrumb />
          </div>

          <div className="max-w-4xl mx-auto space-y-12">
            {faqCategories.map((category, catIndex) => (
              <section key={catIndex}>
                {/* Category Header */}
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <category.icon className="w-5 h-5 text-primary" />
                  </div>
                  <h2 className="text-xl md:text-2xl font-bold text-foreground">
                    {category.title}
                  </h2>
                </div>

                {/* FAQ Accordion */}
                <Accordion type="single" collapsible className="space-y-3">
                  {category.faqs.map((faq, faqIndex) => (
                    <AccordionItem
                      key={faqIndex}
                      value={`cat-${catIndex}-item-${faqIndex}`}
                      className="bg-card border border-border rounded-xl px-6 data-[state=open]:ring-2 data-[state=open]:ring-primary/20"
                    >
                      <AccordionTrigger className="text-left text-base md:text-lg font-medium py-5 hover:no-underline">
                        {faq.question}
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground pb-5 text-base leading-relaxed">
                        {faq.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </section>
            ))}

            {/* Contact CTA */}
            <Card className="border-primary/20 bg-primary/5 mt-12">
              <CardContent className="p-6 md:p-8">
                <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                  <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <MessageCircle className="w-7 h-7 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-semibold text-foreground mb-2">
                      Fandt du ikke svar på dit spørgsmål?
                    </h2>
                    <p className="text-muted-foreground">
                      Kontakt os, og vi hjælper dig gerne. Vi svarer normalt inden for 1-2 hverdage.
                    </p>
                  </div>
                  <Button asChild size="lg" className="w-full md:w-auto">
                    <Link to="/contact">
                      Kontakt os
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Quick Links */}
            <div className="grid sm:grid-cols-3 gap-4 pt-8">
              <Link 
                to="/pricing" 
                className="p-4 bg-card border border-border rounded-xl hover:border-primary/50 transition-colors text-center"
              >
                <CreditCard className="w-6 h-6 text-primary mx-auto mb-2" />
                <span className="font-medium text-foreground">Se priser</span>
              </Link>
              <Link 
                to="/privacy" 
                className="p-4 bg-card border border-border rounded-xl hover:border-primary/50 transition-colors text-center"
              >
                <Lock className="w-6 h-6 text-primary mx-auto mb-2" />
                <span className="font-medium text-foreground">Privatlivspolitik</span>
              </Link>
              <Link 
                to="/terms" 
                className="p-4 bg-card border border-border rounded-xl hover:border-primary/50 transition-colors text-center"
              >
                <Shield className="w-6 h-6 text-primary mx-auto mb-2" />
                <span className="font-medium text-foreground">Vilkår & betingelser</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
};

export default FAQ;
