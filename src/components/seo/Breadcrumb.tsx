import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items?: BreadcrumbItem[];
  className?: string;
}

// Route to label mapping for automatic breadcrumb generation
const routeLabels: Record<string, string> = {
  '/': 'Forside',
  '/dashboard': 'Dashboard',
  '/guides': 'Guides',
  '/faq': 'FAQ',
  '/pricing': 'Priser',
  '/help': 'Hjælp',
  '/contact': 'Kontakt',
  '/settings': 'Indstillinger',
  '/login': 'Log ind',
  '/signup': 'Opret konto',
  '/privacy': 'Privatlivspolitik',
  '/terms': 'Vilkår',
  '/safety': 'Sikkerhed',
  '/security-check': 'Sikkerhedstjek',
  '/scam-quiz': 'Svindelquiz',
  '/tech-dictionary': 'Teknisk Ordbog',
  '/battery-doctor': 'Batteri Doktor',
  '/password-generator': 'Kodeord Generator',
  '/kode-mappe': 'Kode Mappe',
  '/screenshot-ai': 'Screenshot AI',
  '/hardware-detective': 'Hardware Detektiv',
  '/panic': 'Panikknap',
  '/checkin': 'Månedstjek',
  '/wishlist': 'Ønskeseddel',
  '/medical-id': 'Læge-ID',
  '/guest-wifi': 'Gæste-WiFi',
  '/cleaning-guide': 'Rengøringsguide',
  '/device-setup': 'Enhedsopsætning',
};

/**
 * Generate breadcrumb items from current route
 */
function generateBreadcrumbs(pathname: string): BreadcrumbItem[] {
  if (pathname === '/') {
    return [{ label: 'Forside' }];
  }

  const segments = pathname.split('/').filter(Boolean);
  const items: BreadcrumbItem[] = [{ label: 'Forside', href: '/' }];

  let currentPath = '';
  segments.forEach((segment, index) => {
    currentPath += `/${segment}`;
    const isLast = index === segments.length - 1;
    const label = routeLabels[currentPath] || segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ');

    items.push({
      label,
      href: isLast ? undefined : currentPath,
    });
  });

  return items;
}

export function Breadcrumb({ items, className }: BreadcrumbProps) {
  const location = useLocation();
  const breadcrumbItems = items || generateBreadcrumbs(location.pathname);

  // Don't show breadcrumb on homepage
  if (location.pathname === '/') {
    return null;
  }

  return (
    <nav
      aria-label="Breadcrumb"
      className={cn('flex items-center text-sm text-muted-foreground', className)}
    >
      <ol className="flex items-center flex-wrap gap-1">
        {breadcrumbItems.map((item, index) => (
          <li key={index} className="flex items-center">
            {index > 0 && (
              <ChevronRight className="h-4 w-4 mx-1 flex-shrink-0" aria-hidden="true" />
            )}
            {item.href ? (
              <Link
                to={item.href}
                className="hover:text-foreground transition-colors flex items-center gap-1"
              >
                {index === 0 && <Home className="h-3.5 w-3.5" aria-hidden="true" />}
                <span>{item.label}</span>
              </Link>
            ) : (
              <span className="text-foreground font-medium" aria-current="page">
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

/**
 * Generate JSON-LD breadcrumb schema for SEO
 */
export function generateBreadcrumbSchema(pathname: string): object {
  const items = generateBreadcrumbs(pathname);
  
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.label,
      item: item.href
        ? `https://www.mittek.dk${item.href}`
        : `https://www.mittek.dk${pathname}`,
    })),
  };
}
