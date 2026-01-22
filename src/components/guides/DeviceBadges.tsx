import { Smartphone, Tablet, Monitor } from 'lucide-react';

interface DeviceBadgesProps {
  steps: Array<{ device_type?: string[] }>;
  className?: string;
}

export const DeviceBadges = ({ steps, className = '' }: DeviceBadgesProps) => {
  // Determine which devices are supported based on step device_types
  const supportedDevices = new Set<string>();
  
  steps.forEach(step => {
    const deviceTypes = step.device_type as string[] | undefined;
    if (!deviceTypes || deviceTypes.length === 0 || deviceTypes.includes('universal')) {
      // Universal step - supports all devices
      supportedDevices.add('iphone');
      supportedDevices.add('ipad');
      supportedDevices.add('mac');
    } else {
      deviceTypes.forEach(d => supportedDevices.add(d));
    }
  });

  const hasIphone = supportedDevices.has('iphone');
  const hasIpad = supportedDevices.has('ipad');
  const hasMac = supportedDevices.has('mac');

  // If supports all or none, don't show badges (universal)
  const totalDevices = (hasIphone ? 1 : 0) + (hasIpad ? 1 : 0) + (hasMac ? 1 : 0);
  if (totalDevices === 3 || totalDevices === 0) {
    return null;
  }

  return (
    <div className={`flex gap-1 ${className}`}>
      {hasIphone && (
        <div 
          className="w-5 h-5 rounded-full bg-background/90 backdrop-blur-sm flex items-center justify-center shadow-sm border border-border/50"
          title="iPhone"
        >
          <Smartphone className="h-3 w-3 text-foreground/80" />
        </div>
      )}
      {hasIpad && (
        <div 
          className="w-5 h-5 rounded-full bg-background/90 backdrop-blur-sm flex items-center justify-center shadow-sm border border-border/50"
          title="iPad"
        >
          <Tablet className="h-3 w-3 text-foreground/80" />
        </div>
      )}
      {hasMac && (
        <div 
          className="w-5 h-5 rounded-full bg-background/90 backdrop-blur-sm flex items-center justify-center shadow-sm border border-border/50"
          title="Mac"
        >
          <Monitor className="h-3 w-3 text-foreground/80" />
        </div>
      )}
    </div>
  );
};
