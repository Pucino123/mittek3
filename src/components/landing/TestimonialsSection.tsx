import { Star, Quote } from 'lucide-react';

const testimonials = [
  {
    name: 'Birthe M.',
    plan: 'Basic-Medlem',
    quote: 'Endelig en tjeneste der taler mit sprog! Jeg har lært at bruge min iPhone på en måde, jeg aldrig troede var muligt. Guiderne er så nemme at følge.',
    rating: 5,
    avatar: 'B',
  },
  {
    name: 'Hans Erik J.',
    plan: 'Plus-Medlem',
    quote: 'Kode-mappen er guld værd. Nu har jeg alle mine adgangskoder samlet ét sikkert sted, og jeg behøver ikke længere skrive dem på papir.',
    rating: 5,
    avatar: 'H',
  },
  {
    name: 'Inge L.',
    plan: 'Basic-Medlem',
    quote: 'Min datter anbefalede MitTek til mig, og det var det bedste råd hun kunne give. Nu føler jeg mig meget mere tryg ved at bruge min iPad.',
    rating: 5,
    avatar: 'I',
  },
  {
    name: 'Poul A.',
    plan: 'Pro-Medlem',
    quote: 'Den månedlige check-in hjælper mig med at holde styr på tingene. Og når jeg har et spørgsmål, får jeg altid hurtig og venlig hjælp.',
    rating: 5,
    avatar: 'P',
  },
];

export function TestimonialsSection() {
  return (
    <section 
      className="py-16 md:py-24 bg-gradient-to-b from-background to-muted/30"
      aria-labelledby="testimonials-heading"
    >
      <div className="container px-4">
        {/* Header */}
        <header className="text-center mb-12 md:mb-16">
          <span className="inline-block px-4 py-1.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-sm font-medium mb-4">
            ⭐️ 4.9 ud af 5 stjerner
          </span>
          <h2 id="testimonials-heading" className="text-3xl md:text-4xl font-bold mb-4">
            Det siger vores brugere
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Hundredvis af tilfredse brugere har allerede taget kontrol over deres digitale liv
          </p>
        </header>

        {/* Testimonials Grid */}
        <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto" role="list" aria-label="Kundeanmeldelser">
          {testimonials.map((testimonial, index) => (
            <article 
              key={index}
              className="relative bg-card border border-border rounded-2xl p-6 md:p-8 transition-shadow"
              role="listitem"
            >
              {/* Quote Icon */}
              <div className="absolute top-6 right-6 text-primary/10" aria-hidden="true">
                <Quote className="w-10 h-10" />
              </div>

              {/* Stars */}
              <div className="flex gap-1 mb-4" aria-label={`${testimonial.rating} ud af 5 stjerner`}>
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" aria-hidden="true" />
                ))}
              </div>

              {/* Quote */}
              <blockquote className="text-foreground text-lg leading-relaxed mb-6">
                <p>"{testimonial.quote}"</p>
              </blockquote>

              {/* Author */}
              <footer className="flex items-center gap-3">
                <div 
                  className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-lg"
                  aria-hidden="true"
                >
                  {testimonial.avatar}
                </div>
                <div className="flex flex-col">
                  <cite className="font-semibold text-foreground not-italic">{testimonial.name}</cite>
                  <span className="text-sm text-muted-foreground">{testimonial.plan}</span>
                </div>
              </footer>
            </article>
          ))}
        </div>

        {/* Trust Indicators */}
        <aside className="mt-12 md:mt-16 flex flex-wrap justify-center items-center gap-6 md:gap-10 text-muted-foreground" aria-label="Tillid og statistik">
          <div className="flex items-center gap-2">
            <div className="flex -space-x-2" aria-hidden="true">
              {['B', 'H', 'I', 'P'].map((letter, i) => (
                <div 
                  key={i}
                  className="w-8 h-8 rounded-full bg-primary/10 border-2 border-background flex items-center justify-center text-primary text-xs font-medium"
                >
                  {letter}
                </div>
              ))}
            </div>
            <span className="text-sm">500+ aktive brugere</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex gap-0.5" aria-hidden="true">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
              ))}
            </div>
            <span className="text-sm">4.9/5 gennemsnit</span>
          </div>
          <div className="text-sm">
            🇩🇰 100% dansk support
          </div>
        </aside>
      </div>
    </section>
  );
}
