// Category-based covers for guides - using public folder paths for fallback
export const coversByCategory: Record<string, string> = {
  'batteri': '/guide-covers/category-battery.jpg',
  'icloud': '/guide-covers/category-icloud.jpg',
  'sikkerhed': '/guide-covers/category-security.jpg',
  'apps': '/guide-covers/category-apps.jpg',
  'beskeder': '/guide-covers/category-messages.jpg',
  'hverdag': '/guide-covers/category-daily.jpg',
  'oprydning': '/guide-covers/category-cleanup.jpg',
  'forbindelse': '/guide-covers/category-connection.jpg',
};

// Get cover image fallback - only used if guide.cover_image_url is null
export const getCoverImage = (slug: string | null | undefined, category: string | undefined): string | null => {
  // Fallback to category cover if no database URL
  if (category && coversByCategory[category]) {
    return coversByCategory[category];
  }
  return null;
};
