import { Link } from 'react-router-dom';
import { PublicLayout } from '@/components/layout/PublicLayout';
import { SEOHead, breadcrumbSchema } from '@/components/seo/SEOHead';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Lock, Smartphone, ArrowRight, BookOpen } from 'lucide-react';

interface Article {
  slug: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  category: string;
  readTime: string;
}

const articles: Article[] = [
  {
    slug: 'sikker-adgangskode',
    title: 'Sådan laver du en sikker adgangskode, du kan huske',
    description: 'Lær den nemmeste måde at lave stærke adgangskoder på – uden at skulle huske tilfældige tegn.',
    icon: <Lock className="h-6 w-6" />,
    category: 'Sikkerhed',
    readTime: '3 min',
  },
  {
    slug: 'langsom-iphone',
    title: '5 ting du skal gøre, hvis din iPhone er langsom',
    description: 'Simple trin der kan få din iPhone til at køre hurtigt igen – uden at slette alt.',
    icon: <Smartphone className="h-6 w-6" />,
    category: 'iPhone Tips',
    readTime: '4 min',
  },
];

const Viden = () => {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        'name': 'Gratis Tips - MitTek',
        'description': 'Gratis IT-tips og guides til iPhone, iPad og Mac. Lær at beskytte dig selv online og få mere ud af din Apple-enhed.',
        'url': 'https://www.mittek.dk/viden',
      },
      breadcrumbSchema([
        { name: 'Forside', url: 'https://www.mittek.dk/' },
        { name: 'Gratis Tips', url: 'https://www.mittek.dk/viden' },
      ]),
    ],
  };

  return (
    <PublicLayout>
      <SEOHead
        title="Gratis Tips - MitTek | IT-hjælp til iPhone, iPad og Mac"
        description="Gratis IT-tips og guides til iPhone, iPad og Mac. Lær at lave sikre adgangskoder, gør din iPhone hurtigere og meget mere."
        canonical="https://www.mittek.dk/viden"
        jsonLd={jsonLd}
      />

      <div className="container py-12 md:py-16 px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-6">
            <BookOpen className="h-4 w-4" />
            <span className="text-sm font-medium">Gratis Viden</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            Gratis Tips til din iPhone, iPad og Mac
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Enkle og forståelige guides skrevet på dansk. Ingen teknisk snak – bare klare svar.
          </p>
        </div>

        {/* Articles Grid */}
        <div className="grid gap-6 md:grid-cols-2 max-w-4xl mx-auto">
          {articles.map((article) => (
            <Link key={article.slug} to={`/viden/${article.slug}`} className="group">
              <Card className="h-full transition-all duration-300 hover:shadow-lg hover:border-primary/30 group-hover:-translate-y-1">
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="secondary" className="font-medium">
                      {article.category}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{article.readTime} læsetid</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
                      {article.icon}
                    </div>
                    <CardTitle className="text-lg leading-snug group-hover:text-primary transition-colors">
                      {article.title}
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base mb-4">
                    {article.description}
                  </CardDescription>
                  <div className="flex items-center text-primary font-medium text-sm group-hover:gap-3 gap-2 transition-all">
                    Læs artikel
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* CTA Section */}
        <div className="mt-16 text-center">
          <div className="card-elevated p-8 max-w-2xl mx-auto">
            <h2 className="text-xl font-semibold mb-3">Vil du have mere hjælp?</h2>
            <p className="text-muted-foreground mb-6">
              Med MitTek får du adgang til alle vores guides, værktøjer og personlig support.
            </p>
            <Link to="/pricing">
              <button className="btn-primary">
                Se vores planer
              </button>
            </Link>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
};

export default Viden;
