import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { HelpCircle } from 'lucide-react';

const faqs = [
  {
    question: 'Hvad er MitTek?',
    answer: 'MitTek er en dansk tjeneste for alle, der kan have lidt svært ved teknologi - uanset alder. Vi hjælper dig med at bruge iPhone, iPad og Mac trygt og sikkert gennem letforståelige guides, sikkerhedsværktøjer og personlig support. Alt sammen på dansk og tilpasset dit tempo.',
  },
  {
    question: 'Er MitTek tilknyttet Apple?',
    answer: 'Nej, MitTek er en uafhængig dansk virksomhed og er ikke tilknyttet Apple Inc. Vi er specialiseret i at hjælpe med Apple-produkter, men vi er ikke en officiel Apple-partner.',
  },
  {
    question: 'Hvad koster det?',
    answer: 'Vi har tre planer: Basic (39 kr./md) med adgang til alle guides, Plus (79 kr./md) som inkluderer Kode-mappe og AI-hjælp, og Pro (99 kr./md) med prioriteret support. Du kan opsige når som helst uden binding.',
  },
  {
    question: 'Kan jeg prøve MitTek gratis?',
    answer: 'Ja! Du har 14 dages fortrydelsesret med fuld refusion. Opret en konto, prøv tjenesten, og hvis du ikke er tilfreds, får du pengene tilbage - ingen spørgsmål stillet.',
  },
  {
    question: 'Hvad er Kode-mappen?',
    answer: 'Kode-mappen er et sikkert, krypteret sted hvor du kan gemme dine adgangskoder, pinkoder og andre vigtige oplysninger. Alt er beskyttet med stærk kryptering, så kun du kan se indholdet.',
  },
  {
    question: 'Hvordan fungerer den månedlige check-in?',
    answer: 'Hver måned får du en påmindelse om at lave et hurtigt "sundhedstjek" af din enhed. Vi stiller et par simple spørgsmål og giver dig personlige anbefalinger baseret på dine svar. Det tager kun 2-3 minutter.',
  },
  {
    question: 'Kan min familie hjælpe mig gennem MitTek?',
    answer: 'Ja! Med "Betroet Hjælper"-funktionen kan du invitere et familiemedlem til at følge med i din tekniske sundhed. De kan se dine check-ins og hjælpe dig på afstand - helt sikkert og privat.',
  },
  {
    question: 'Er mine data sikre hos MitTek?',
    answer: 'Absolut. Vi bruger bankniveau-kryptering til alle følsomme data, og vi sælger ALDRIG dine oplysninger til tredjeparter. Du kan læse mere i vores privatlivspolitik.',
  },
];

export function FAQSection() {
  return (
    <section className="py-16 md:py-24 bg-muted/30">
      <div className="container px-4">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-primary/10 rounded-full mb-6">
              <HelpCircle className="w-7 h-7 text-primary" />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ofte stillede spørgsmål
            </h2>
            <p className="text-lg text-muted-foreground">
              Få svar på de mest almindelige spørgsmål om MitTek
            </p>
          </div>

          {/* FAQ Accordion */}
          <Accordion type="single" collapsible className="space-y-3">
            {faqs.map((faq, index) => (
              <AccordionItem 
                key={index} 
                value={`item-${index}`}
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

          {/* CTA */}
          <div className="mt-10 text-center">
            <p className="text-muted-foreground">
              Har du andre spørgsmål?{' '}
              <a href="/contact" className="text-primary font-medium hover:underline">
                Kontakt os
              </a>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
