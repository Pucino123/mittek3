import { UserPlus, BookOpen, Shield, Sparkles } from 'lucide-react';

const steps = [
  {
    number: '1',
    icon: UserPlus,
    title: 'Opret din konto',
    description: 'Det tager kun 2 minutter. Vælg dit abonnement og kom i gang med det samme.',
    color: 'bg-blue-500',
  },
  {
    number: '2',
    icon: BookOpen,
    title: 'Følg vores guides',
    description: 'Trin-for-trin vejledninger med billeder og tips tilpasset netop din enhed.',
    color: 'bg-green-500',
  },
  {
    number: '3',
    icon: Shield,
    title: 'Bliv mere sikker',
    description: 'Lær at genkende svindel, beskyt dine adgangskoder og hold din enhed opdateret.',
    color: 'bg-amber-500',
  },
  {
    number: '4',
    icon: Sparkles,
    title: 'Få løbende hjælp',
    description: 'Månedlige check-ins, personlige anbefalinger og support når du har brug for det.',
    color: 'bg-purple-500',
  },
];

export function HowItWorksSection() {
  return (
    <section className="py-16 md:py-24 bg-background">
      <div className="container px-4">
        {/* Header */}
        <div className="text-center mb-12 md:mb-16">
          <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            Kom i gang
          </span>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Sådan virker MitTek
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Fire simple trin til en tryggere digital hverdag
          </p>
        </div>

        {/* Steps - Desktop */}
        <div className="hidden md:block max-w-5xl mx-auto">
          <div className="relative">
            {/* Steps Grid */}
            <div className="grid grid-cols-4 gap-6">
              {steps.map((step, index) => (
                <div key={index} className="relative text-center">
                  {/* Step Number with Icon */}
                  <div className="relative inline-flex mb-6">
                    <div className={`w-32 h-32 rounded-3xl ${step.color} bg-opacity-10 flex items-center justify-center relative`}>
                      <step.icon className={`w-12 h-12 ${step.color.replace('bg-', 'text-')}`} />
                      {/* Number Badge */}
                      <div className={`absolute -top-2 -right-2 w-8 h-8 ${step.color} rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg`}>
                        {step.number}
                      </div>
                    </div>
                  </div>
                  
                  {/* Content */}
                  <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {step.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Steps - Mobile */}
        <div className="md:hidden space-y-6">
          {steps.map((step, index) => (
            <div 
              key={index} 
              className="flex gap-4 p-4 rounded-2xl bg-card border border-border"
            >
              {/* Icon */}
              <div className="flex-shrink-0">
                <div className={`w-16 h-16 rounded-2xl ${step.color} bg-opacity-10 flex items-center justify-center relative`}>
                  <step.icon className={`w-7 h-7 ${step.color.replace('bg-', 'text-')}`} />
                  <div className={`absolute -top-1 -right-1 w-6 h-6 ${step.color} rounded-full flex items-center justify-center text-white font-bold text-xs shadow-lg`}>
                    {step.number}
                  </div>
                </div>
              </div>
              
              {/* Content */}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-lg mb-1">{step.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="mt-12 text-center">
          <div className="inline-flex flex-col sm:flex-row items-center gap-4 p-6 rounded-2xl bg-primary/5 border border-primary/10">
            <div className="text-center sm:text-left">
              <p className="font-semibold text-lg">Klar til at komme i gang?</p>
              <p className="text-muted-foreground text-sm">
                Opret din konto på under 2 minutter
              </p>
            </div>
            <a 
              href="/signup"
              className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
            >
              Opret gratis konto
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
