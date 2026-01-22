// Guide cover image imports - unique covers per guide
import guideDownloadApps from './guide-download-apps.jpg';
import guideDeleteApps from './guide-delete-apps.jpg';
import guideUpdateApps from './guide-update-apps.jpg';
import guideOrganizeApps from './guide-organize-apps.jpg';
import guideExtendBattery from './guide-extend-battery.jpg';
import guideBatteryHealth from './guide-battery-health.jpg';
import guideCleanupMessages from './guide-cleanup-messages.jpg';
import guideImessageSetup from './guide-imessage-setup.jpg';
import guideBlockSpam from './guide-block-spam.jpg';
import guideUpdateIos from './guide-update-ios.jpg';
import guideStopPopups from './guide-stop-popups.jpg';
import guideBiggerText from './guide-bigger-text.jpg';
import guideIcloudBackup from './guide-icloud-backup.jpg';
import guideIcloudPhotos from './guide-icloud-photos.jpg';
import guideIcloudCleanup from './guide-icloud-cleanup.jpg';
import guideBlockCalls from './guide-block-calls.jpg';
import guide2fa from './guide-2fa.jpg';
import guideFindMy from './guide-find-my.jpg';
import guideScamMessages from './guide-scam-messages.jpg';
import guideHardReset from './guide-hard-reset.jpg';

// Map guide slugs to their unique cover images
export const guideCoversBySlug: Record<string, string> = {
  'download-apps': guideDownloadApps,
  'delete-apps': guideDeleteApps,
  'update-apps': guideUpdateApps,
  'organize-apps': guideOrganizeApps,
  'extend-battery-life': guideExtendBattery,
  'battery-health-tips': guideBatteryHealth,
  'cleanup-messages': guideCleanupMessages,
  'imessage-setup': guideImessageSetup,
  'block-spam-messages': guideBlockSpam,
  'update-ios': guideUpdateIos,
  'stop-popups': guideStopPopups,
  'bigger-text': guideBiggerText,
  'icloud-backup': guideIcloudBackup,
  'icloud-photos': guideIcloudPhotos,
  'icloud-cleanup': guideIcloudCleanup,
  'block-unknown-calls': guideBlockCalls,
  'enable-2fa': guide2fa,
  'find-my-iphone': guideFindMy,
  'recognize-scam-messages': guideScamMessages,
  'hard-reset': guideHardReset,
};

// Fallback category-based covers (kept for any new guides without unique covers)
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

// Get cover image - prioritize slug-specific, then category fallback
export const getCoverImage = (slug: string | null | undefined, category: string | undefined): string | null => {
  // First try slug-specific cover
  if (slug && guideCoversBySlug[slug]) {
    return guideCoversBySlug[slug];
  }
  // Fallback to category cover
  if (category && coversByCategory[category]) {
    return coversByCategory[category];
  }
  return null;
};
