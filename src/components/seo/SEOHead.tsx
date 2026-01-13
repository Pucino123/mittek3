import { useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';

const BASE_URL = 'https://www.mittek.dk';

interface SEOHeadProps {
  title?: string;
  description?: string;
  /** Override auto-generated canonical URL. If not provided, uses current route. */
  canonical?: string;
  ogImage?: string;
  ogType?: 'website' | 'article';
  noindex?: boolean;
  jsonLd?: object;
}

export function SEOHead({
  title = 'MitTek - Tryg IT for Seniorer',
  description = 'Få hjælp til din iPhone, iPad og Mac. Enkle guides, trygge værktøjer og personlig hjælp til alle der har brug for teknisk hjælp. Lær i dit eget tempo.',
  canonical,
  ogImage = `${BASE_URL}/og-image.png`,
  ogType = 'website',
  noindex = false,
  jsonLd,
}: SEOHeadProps) {
  const location = useLocation();
  
  // Auto-generate canonical URL from current route if not provided - memoized to prevent re-renders
  const canonicalUrl = useMemo(
    () => canonical || `${BASE_URL}${location.pathname === '/' ? '' : location.pathname}`,
    [canonical, location.pathname]
  );
  
  useEffect(() => {
    // Update document title
    document.title = title.length > 60 ? title.slice(0, 57) + '...' : title;

    // Helper function to update or create meta tag
    const setMetaTag = (name: string, content: string, isProperty = false) => {
      const attr = isProperty ? 'property' : 'name';
      let element = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement;
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attr, name);
        document.head.appendChild(element);
      }
      element.content = content;
    };

    // Meta description
    setMetaTag('description', description.length > 160 ? description.slice(0, 157) + '...' : description);

    // Robots
    if (noindex) {
      setMetaTag('robots', 'noindex, nofollow');
    } else {
      setMetaTag('robots', 'index, follow');
    }

    // Open Graph
    setMetaTag('og:title', title, true);
    setMetaTag('og:description', description, true);
    setMetaTag('og:type', ogType, true);
    setMetaTag('og:image', ogImage, true);
    setMetaTag('og:locale', 'da_DK', true);
    setMetaTag('og:site_name', 'MitTek', true);

    setMetaTag('og:url', canonicalUrl, true);

    // Twitter Card
    setMetaTag('twitter:card', 'summary_large_image');
    setMetaTag('twitter:title', title);
    setMetaTag('twitter:description', description);
    setMetaTag('twitter:image', ogImage);

    // Canonical URL - always set (auto-generated or explicit)
    let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!link) {
      link = document.createElement('link');
      link.rel = 'canonical';
      document.head.appendChild(link);
    }
    link.href = canonicalUrl;

    // JSON-LD structured data
    if (jsonLd) {
      const existingScript = document.querySelector('script[data-seo-jsonld]');
      if (existingScript) {
        existingScript.remove();
      }
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.setAttribute('data-seo-jsonld', 'true');
      script.textContent = JSON.stringify(jsonLd);
      document.head.appendChild(script);
    }

    return () => {
      // Cleanup JSON-LD on unmount
      const script = document.querySelector('script[data-seo-jsonld]');
      if (script) script.remove();
    };
  }, [title, description, canonicalUrl, ogImage, ogType, noindex, jsonLd]);

  return null;
}

// Pre-built JSON-LD schemas
export const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'MitTek',
  description: 'Tryg IT-hjælp til alle der har brug for teknisk support',
  url: 'https://www.mittek.dk',
  logo: 'https://www.mittek.dk/favicon.svg',
  contactPoint: {
    '@type': 'ContactPoint',
    contactType: 'customer service',
    availableLanguage: 'Danish',
  },
  sameAs: [],
};

export const serviceSchema = {
  '@context': 'https://schema.org',
  '@type': 'Service',
  name: 'MitTek IT-hjælp',
  description: 'Personlig IT-hjælp til iPhone, iPad og Mac med letforståelige guides og dansk support',
  provider: {
    '@type': 'Organization',
    name: 'MitTek',
  },
  serviceType: 'IT Support',
  areaServed: {
    '@type': 'Country',
    name: 'Denmark',
  },
  availableLanguage: 'Danish',
};

export const faqSchema = (faqs: { question: string; answer: string }[]) => ({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqs.map((faq) => ({
    '@type': 'Question',
    name: faq.question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: faq.answer,
    },
  })),
});

export const breadcrumbSchema = (items: { name: string; url: string }[]) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: items.map((item, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: item.name,
    item: item.url,
  })),
});
