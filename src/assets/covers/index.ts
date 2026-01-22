// Fallback category-based covers for guides without database cover_image_url
import guideBattery from './guide-battery.jpg';
import guideIcloud from './guide-icloud.jpg';
import guideSecurity from './guide-security.jpg';
import guideApps from './guide-apps.jpg';
import guideMessages from './guide-messages.jpg';
import guideDaily from './guide-daily.jpg';

export const coversByCategory: Record<string, string> = {
  'batteri': guideBattery,
  'icloud': guideIcloud,
  'sikkerhed': guideSecurity,
  'apps': guideApps,
  'beskeder': guideMessages,
  'hverdag': guideDaily,
};

// Get cover image fallback - only used if guide.cover_image_url is null
export const getCoverImage = (slug: string | null | undefined, category: string | undefined): string | null => {
  // Fallback to category cover if no database URL
  if (category && coversByCategory[category]) {
    return coversByCategory[category];
  }
  return null;
};
