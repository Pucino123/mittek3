import { ShieldCheck, KeyRound, BookOpen, AlertTriangle } from 'lucide-react';

const valueProps = [
  {
    icon: ShieldCheck,
    title: 'Undgå svindel',
    description: 'Tjek mistænkelige SMS\'er og emails. Vores AI hjælper dig med at spotte faldgruber.',
    color: 'text-success',
    bgColor: 'bg-success/10',
  },
  {
    icon: KeyRound,
    title: 'Husk dine koder',
    description: 'Gem dine vigtige koder sikkert i Kode-mappen. Krypteret og kun for dig.',
    color: 'text-primary',
    bgColor: 'bg-primary/10',
  },
  {
    icon: BookOpen,
    title: 'Trin-for-trin guides',
    description: 'Billedguides der viser præcis, hvor du skal trykke. Nemt at følge.',
    color: 'text-info',
    bgColor: 'bg-info/10',
  },
  {
    icon: AlertTriangle,
    title: 'Tryghedsknap',
    description: 'Usikker på noget? Tryk på knappen og få en rolig handlingsplan med det samme.',
    color: 'text-warning',
    bgColor: 'bg-warning/10',
  },
];

export function ValuePropsSection() {
  return (
    <section className="py-12 md:py-24">
      <div className="container px-4">
        <div className="text-center mb-8 md:mb-12">
          <h2 className="text-2xl md:text-4xl font-bold mb-4">
            Alt hvad du har brug for
          </h2>
          <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
            Vi har samlet de vigtigste funktioner, der gør din digitale hverdag mere tryg.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {valueProps.map((prop, index) => (
            <div 
              key={prop.title}
              className="card-elevated p-5 md:p-6 text-center"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className={`w-12 h-12 md:w-14 md:h-14 rounded-2xl ${prop.bgColor} flex items-center justify-center mx-auto mb-4`}>
                <prop.icon className={`h-6 w-6 md:h-7 md:w-7 ${prop.color}`} />
              </div>
              <h3 className="text-base md:text-lg font-semibold mb-2">{prop.title}</h3>
              <p className="text-sm md:text-base text-muted-foreground">{prop.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
