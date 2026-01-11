import { MessageCircle, Clock, HelpCircle, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export function AITechnicianSection() {
  return (
    <section className="py-12 md:py-24 bg-secondary/30">
      <div className="container px-4">
        <div className="grid lg:grid-cols-2 gap-8 md:gap-12 items-center">
          {/* Content */}
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary font-medium text-sm mb-4 md:mb-6">
              <MessageCircle className="h-4 w-4" />
              <span>Ny funktion</span>
            </div>
            
            <h2 className="text-2xl md:text-4xl font-bold mb-4 md:mb-6">
              Spørg om alt — når som helst
            </h2>
            
            <p className="text-base md:text-lg text-muted-foreground mb-6 md:mb-8">
              Med Din Digitale Hjælper kan du skrive spørgsmål på helt almindeligt dansk, 
              døgnet rundt. Ingen telefonkø. Ingen dumme spørgsmål.
            </p>

            <ul className="space-y-4 mb-6 md:mb-8">
              <li className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-success/10 flex items-center justify-center mt-0.5">
                  <Clock className="h-4 w-4 text-success" />
                </div>
                <div>
                  <p className="font-medium">Åben 24/7</p>
                  <p className="text-sm md:text-base text-muted-foreground">Få hjælp, uanset hvornår du har brug for det</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-success/10 flex items-center justify-center mt-0.5">
                  <HelpCircle className="h-4 w-4 text-success" />
                </div>
                <div>
                  <p className="font-medium">Forstår almindeligt dansk</p>
                  <p className="text-sm md:text-base text-muted-foreground">Ingen teknisk jargon nødvendig</p>
                </div>
              </li>
            </ul>

            <Link to="/pricing" className="block sm:inline-block">
              <Button variant="hero" size="lg" className="w-full sm:w-auto min-h-[52px]">
                Prøv Din Digitale Hjælper
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>

          {/* Chat preview mockup */}
          <div className="relative order-first lg:order-last">
            <div className="card-elevated p-4 md:p-6 max-w-md mx-auto">
              {/* Chat header */}
              <div className="flex items-center gap-3 pb-4 border-b border-border mb-4">
                <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                  <MessageCircle className="h-5 w-5 text-primary-foreground" />
                </div>
                <div>
                  <p className="font-semibold">Din Digitale Hjælper</p>
                  <p className="text-sm text-success flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-success"></span>
                    Online nu
                  </p>
                </div>
              </div>

              {/* Chat messages */}
              <div className="space-y-4">
                {/* User message */}
                <div className="flex justify-end">
                  <div className="bg-primary text-primary-foreground rounded-2xl rounded-br-md px-4 py-3 max-w-[85%]">
                    <p className="text-sm md:text-base">Hvorfor går min skærm i sort, når jeg ringer?</p>
                  </div>
                </div>

                {/* AI response */}
                <div className="flex justify-start">
                  <div className="bg-secondary rounded-2xl rounded-bl-md px-4 py-3 max-w-[85%]">
                    <p className="text-sm md:text-base text-foreground">
                      Det er helt normalt! Din iPhone slukker skærmen for at spare strøm, 
                      når du holder telefonen op til øret. Når du fjerner den, tænder skærmen igen. 
                      Vil du vide mere?
                    </p>
                  </div>
                </div>
              </div>

              {/* Input field mockup */}
              <div className="mt-6 flex items-center gap-3">
                <div className="flex-1 bg-muted rounded-xl px-4 py-3 text-muted-foreground text-sm md:text-base">
                  Skriv dit spørgsmål...
                </div>
                <Button size="icon" className="rounded-xl min-w-[44px] min-h-[44px]">
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* Floating decoration */}
            <div className="absolute -top-4 -right-4 w-24 h-24 bg-primary/10 rounded-full blur-2xl -z-10" />
            <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-accent/10 rounded-full blur-2xl -z-10" />
          </div>
        </div>
      </div>
    </section>
  );
}
