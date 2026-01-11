import { PublicLayout } from '@/components/layout/PublicLayout';
import { HeroSection } from '@/components/landing/HeroSection';
import { AITechnicianSection } from '@/components/landing/AITechnicianSection';
import { ValuePropsSection } from '@/components/landing/ValuePropsSection';
import { HowItWorksSection } from '@/components/landing/HowItWorksSection';
import { TestimonialsSection } from '@/components/landing/TestimonialsSection';
import { FAQSection } from '@/components/landing/FAQSection';
import { PricingPreviewSection } from '@/components/landing/PricingPreviewSection';
import { SEOHead, organizationSchema, serviceSchema } from '@/components/seo/SEOHead';
import { LazySection } from '@/components/seo/LazySection';

const Index = () => {
  const combinedSchema = {
    '@context': 'https://schema.org',
    '@graph': [organizationSchema, serviceSchema],
  };

  return (
    <PublicLayout>
      <SEOHead
        title="MitTek - Tryg IT-hjælp til iPhone, iPad og Mac"
        description="Få personlig IT-hjælp til din iPhone, iPad og Mac. Enkle guides, sikkerhedsværktøjer og dansk support for alle der ønsker tryg teknologi."
        canonical="https://www.mittek.dk/"
        jsonLd={combinedSchema}
      />
      
      {/* Critical above-the-fold content */}
      <HeroSection />
      
      {/* Lazy load below-the-fold sections */}
      <LazySection>
        <AITechnicianSection />
      </LazySection>
      
      <LazySection>
        <ValuePropsSection />
      </LazySection>
      
      <LazySection>
        <HowItWorksSection />
      </LazySection>
      
      <LazySection>
        <TestimonialsSection />
      </LazySection>
      
      <LazySection>
        <FAQSection />
      </LazySection>
      
      <LazySection>
        <PricingPreviewSection />
      </LazySection>
    </PublicLayout>
  );
};

export default Index;
