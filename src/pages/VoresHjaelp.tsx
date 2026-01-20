import { PublicLayout } from '@/components/layout/PublicLayout';
import { SEOHead } from '@/components/seo/SEOHead';
import { Breadcrumb } from '@/components/seo/Breadcrumb';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { 
  Heart, 
  Calendar, 
  HelpCircle, 
  Sparkles, 
  BookOpen, 
  Key, 
  FolderLock,
  Battery,
  BookOpenText,
  ShieldAlert,
  IdCard,
  Brain,
  Shield,
  StickyNote,
  Wifi,
  Users,
  Lock,
  Search,
  Star,
  WifiIcon,
  Camera,
  CreditCard,
  ArrowRight,
  CheckCircle
} from 'lucide-react';

interface ToolCardProps {
  icon: React.ReactNode;
  emoji: string;
  title: string;
  description: string;
  benefit: string;
}

const ToolCard = ({ icon, emoji, title, description, benefit }: ToolCardProps) => (
  <div className="bg-card border border-border rounded-2xl p-6 hover:shadow-md transition-shadow">
    <div className="flex items-start gap-4">
      <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 text-2xl">
        {emoji}
      </div>
      <div className="flex-1">
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <p className="text-muted-foreground mb-2">{description}</p>
        <p className="text-sm text-primary font-medium">{benefit}</p>
      </div>
    </div>
  </div>
);

const VoresHjaelp = () => {
  const tools = [
    {
      emoji: '📅',
      icon: <Calendar className="h-6 w-6" />,
      title: 'Månedligt Tjek',
      description: 'En rolig gennemgang af din enhed én gang om måneden.',
      benefit: 'Du får overblik over, om alt fungerer, som det skal.'
    },
    {
      emoji: '🆘',
      icon: <HelpCircle className="h-6 w-6" />,
      title: 'Personlig Hjælp',
      description: 'Du kan spørge om alt. Vi svarer i et enkelt sprog.',
      benefit: 'Du står aldrig alene, når noget er svært.'
    },
    {
      emoji: '🧹',
      icon: <Sparkles className="h-6 w-6" />,
      title: 'Ryd Op',
      description: 'Hjælper dig med at frigøre plads og holde orden.',
      benefit: 'Din enhed kører hurtigere og har mere plads.'
    },
    {
      emoji: '📘',
      icon: <BookOpen className="h-6 w-6" />,
      title: 'Mini-Guides',
      description: 'Korte vejledninger med billeder, trin for trin.',
      benefit: 'Du kan følge med i dit eget tempo.'
    },
    {
      emoji: '🔐',
      icon: <Key className="h-6 w-6" />,
      title: 'Kode-Generator',
      description: 'Laver sikre adgangskoder for dig.',
      benefit: 'Du får stærke koder uden selv at finde på dem.'
    },
    {
      emoji: '🗂',
      icon: <FolderLock className="h-6 w-6" />,
      title: 'Kode-Mappe',
      description: 'Et sikkert sted at gemme dine adgangskoder.',
      benefit: 'Du glemmer aldrig en kode igen.'
    },
    {
      emoji: '🔋',
      icon: <Battery className="h-6 w-6" />,
      title: 'Batteri-Doktor',
      description: 'Forklarer, hvorfor batteriet løber hurtigt tør.',
      benefit: 'Du forstår din enhed bedre og kan spare strøm.'
    },
    {
      emoji: '📖',
      icon: <BookOpenText className="h-6 w-6" />,
      title: 'Ordbog',
      description: 'Forklarer tekniske ord i et enkelt sprog.',
      benefit: 'Du forstår, hvad tingene betyder.'
    },
    {
      emoji: '🚨',
      icon: <ShieldAlert className="h-6 w-6" />,
      title: 'Tryghedsknap',
      description: 'Hurtig hjælp, hvis du føler dig utryg eller usikker.',
      benefit: 'Du ved altid, hvad du skal gøre først.'
    },
    {
      emoji: '🪪',
      icon: <IdCard className="h-6 w-6" />,
      title: 'Nødkort',
      description: 'Dit digitale nødkort med vigtige oplysninger.',
      benefit: 'Andre kan hjælpe dig, hvis der sker noget.'
    },
    {
      emoji: '🧠',
      icon: <Brain className="h-6 w-6" />,
      title: 'Svindel-Quiz',
      description: 'Lær at genkende farlige beskeder.',
      benefit: 'Du bliver tryggere ved at spotte fælder.'
    },
    {
      emoji: '🛡',
      icon: <Shield className="h-6 w-6" />,
      title: 'Sikkerhedsskjold',
      description: 'Tjekker mistænkelige beskeder for dig.',
      benefit: 'Du får klar besked: "trygt" eller "pas på".'
    },
    {
      emoji: '📝',
      icon: <StickyNote className="h-6 w-6" />,
      title: 'Mine Noter',
      description: 'Skriv ting ned, så du ikke glemmer dem.',
      benefit: 'Du har altid et sted at notere vigtige ting.'
    },
    {
      emoji: '📶',
      icon: <Wifi className="h-6 w-6" />,
      title: 'Hastighedstest',
      description: 'Tjekker din internetforbindelse.',
      benefit: 'Du kan se, om dit internet virker ordentligt.'
    },
    {
      emoji: '👨‍👩‍👧',
      icon: <Users className="h-6 w-6" />,
      title: 'Digital Arv',
      description: 'Instruktioner til pårørende, hvis der er behov.',
      benefit: 'Du har styr på det praktiske for fremtiden.'
    },
    {
      emoji: '🔑',
      icon: <Lock className="h-6 w-6" />,
      title: 'Kode-Sundhed',
      description: 'Tjekker om dine adgangskoder er sikre.',
      benefit: 'Du ved, om du bør skifte en kode.'
    },
    {
      emoji: '🕵️',
      icon: <Search className="h-6 w-6" />,
      title: 'Enhedsguide',
      description: 'Lær hvad knapper og dele gør.',
      benefit: 'Du kender din enhed bedre.'
    },
    {
      emoji: '⭐',
      icon: <Star className="h-6 w-6" />,
      title: 'Ønskeliste',
      description: 'Fortæl os, hvad du gerne vil lære.',
      benefit: 'Vi laver hjælp baseret på dine ønsker.'
    },
    {
      emoji: '📡',
      icon: <WifiIcon className="h-6 w-6" />,
      title: 'Gæste-WiFi',
      description: 'Del dit WiFi sikkert med gæster.',
      benefit: 'Gæster kan komme på nettet uden at kende din kode.'
    },
    {
      emoji: '📷',
      icon: <Camera className="h-6 w-6" />,
      title: 'Billede-Hjælp',
      description: 'Tag et billede, og vi forklarer, hvad du ser.',
      benefit: 'Du får hjælp til at forstå skærmbilleder.'
    },
    {
      emoji: '💳',
      icon: <CreditCard className="h-6 w-6" />,
      title: 'Abonnementsoversigt',
      description: 'Hold styr på dine abonnementer.',
      benefit: 'Du ved præcis, hvad du betaler for.'
    }
  ];

  return (
    <PublicLayout>
      <SEOHead 
        title="Vores Hjælp - MitTek"
        description="Se alle de værktøjer og guides, du får adgang til med MitTek. Rolig hjælp, trin for trin, uden teknisk sprog."
        canonical="https://www.mittek.dk/vores-hjaelp"
      />
      
      <section className="py-12 md:py-20 px-4">
        <div className="container max-w-5xl">
          {/* Breadcrumb */}
          <div className="mb-8">
            <Breadcrumb />
          </div>

          {/* Hero */}
          <div className="text-center mb-12 md:mb-16">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <Heart className="h-10 w-10 text-primary" />
            </div>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
              Hjælp, der er nem at forstå
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              Vi guider dig roligt — skridt for skridt.
            </p>
          </div>

          {/* Trust intro */}
          <div className="bg-success/5 border border-success/20 rounded-2xl p-6 md:p-8 mb-12 text-center">
            <p className="text-lg md:text-xl text-foreground leading-relaxed">
              Du behøver ikke vide noget om teknik.
              <br className="hidden md:block" />
              Vi forklarer tingene, som en god ven ville gøre.
            </p>
          </div>

          {/* Tools Grid */}
          <div className="mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">
              Alle værktøjer og guides
            </h2>
            <div className="grid gap-4 md:gap-6 md:grid-cols-2">
              {tools.map((tool, index) => (
                <ToolCard 
                  key={index}
                  emoji={tool.emoji}
                  icon={tool.icon}
                  title={tool.title}
                  description={tool.description}
                  benefit={tool.benefit}
                />
              ))}
            </div>
          </div>

          {/* Trust section */}
          <div className="bg-card border border-border rounded-2xl p-8 md:p-10 mb-12">
            <h2 className="text-2xl font-bold text-center mb-8">
              Det vigtigste for os
            </h2>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="flex items-start gap-4">
                <CheckCircle className="h-6 w-6 text-success flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium mb-1">Du behøver ikke vide noget teknisk</p>
                  <p className="text-sm text-muted-foreground">Vi forklarer alt fra bunden.</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <CheckCircle className="h-6 w-6 text-success flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium mb-1">Der er ingen pres</p>
                  <p className="text-sm text-muted-foreground">Tag den tid, du har brug for.</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <CheckCircle className="h-6 w-6 text-success flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium mb-1">Du kan altid spørge</p>
                  <p className="text-sm text-muted-foreground">Ingen spørgsmål er for små.</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <CheckCircle className="h-6 w-6 text-success flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium mb-1">Vi forklarer som en god ven</p>
                  <p className="text-sm text-muted-foreground">Roligt, venligt og uden fagudtryk.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Closing message */}
          <div className="text-center bg-primary/5 rounded-2xl p-8 mb-8">
            <p className="text-lg text-muted-foreground mb-2">
              Du skal bare føle:
            </p>
            <p className="text-2xl md:text-3xl font-semibold text-primary">
              "Det er helt fint. Jeg bliver hjulpet."
            </p>
          </div>

          {/* CTA */}
          <div className="text-center">
            <Link to="/pricing">
              <Button variant="hero" size="lg" className="rounded-full">
                Se vores planer
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
};

export default VoresHjaelp;