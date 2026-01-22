// Guide cover image imports
import guideBattery from './guide-battery.jpg';
import guideIcloud from './guide-icloud.jpg';
import guideSecurity from './guide-security.jpg';
import guideApps from './guide-apps.jpg';
import guideMessages from './guide-messages.jpg';
import guideDaily from './guide-daily.jpg';

export const coverImages: Record<string, string> = {
  'batteri': guideBattery,
  'icloud': guideIcloud,
  'sikkerhed': guideSecurity,
  'apps': guideApps,
  'beskeder': guideMessages,
  'hverdag': guideDaily,
};

export const getCoverImage = (category: string | undefined): string | null => {
  if (!category) return null;
  return coverImages[category] || null;
};
