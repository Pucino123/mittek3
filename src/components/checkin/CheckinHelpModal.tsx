import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { 
  HelpCircle, 
  CheckCircle2, 
  Lightbulb, 
  Settings, 
  Battery, 
  Cloud, 
  Trash2, 
  RefreshCw,
  ChevronRight,
  Apple
} from "lucide-react";
import { parseTextWithIcons } from '@/utils/inlineIcons';

// Import screenshots
import guideIcloudSettings from '@/assets/guide-icloud-settings.png';
import guideBatterySettings from '@/assets/guide-battery-settings.png';
import guideMacSystemSettings from '@/assets/guide-mac-system-settings.png';
import guideMacTrash from '@/assets/guide-mac-trash.png';

export interface HelpStep {
  instruction: string;
  detail?: string;
  icon?: string;
  image_url?: string;
}

export interface CheckinHelpData {
  title: string;
  steps: HelpStep[];
  tip?: string;
  screenshot?: string;
}

interface CheckinHelpModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  helpData: CheckinHelpData | null;
}

const StepIcon = ({ icon }: { icon?: HelpStep['icon'] }) => {
  switch (icon) {
    case 'settings':
      return <Settings className="h-4 w-4 text-muted-foreground" />;
    case 'battery':
      return <Battery className="h-4 w-4 text-green-600" />;
    case 'cloud':
      return <Cloud className="h-4 w-4 text-blue-500" />;
    case 'trash':
      return <Trash2 className="h-4 w-4 text-muted-foreground" />;
    case 'refresh':
      return <RefreshCw className="h-4 w-4 text-blue-500" />;
    case 'apple':
      return <Apple className="h-4 w-4 text-muted-foreground" />;
    case 'tap':
      return <span className="text-base">👆</span>;
    case 'scroll':
      return <span className="text-base">📜</span>;
    default:
      return <ChevronRight className="h-4 w-4 text-muted-foreground" />;
  }
};

// Get screenshot based on type
const getScreenshot = (type?: string): string | null => {
  switch (type) {
    case 'icloud':
    case 'backup':
      return guideIcloudSettings;
    case 'battery':
      return guideBatterySettings;
    case 'settings':
      return guideIcloudSettings;
    case 'mac-settings':
      return guideMacSystemSettings;
    case 'mac-trash':
      return guideMacTrash;
    default:
      return null;
  }
};

const CheckinHelpModal: React.FC<CheckinHelpModalProps> = ({
  open,
  onOpenChange,
  helpData
}) => {
  if (!helpData) return null;

  const screenshot = getScreenshot(helpData.screenshot);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md mx-auto max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <HelpCircle className="h-5 w-5 text-primary" />
            {helpData.title}
          </DialogTitle>
          <DialogDescription>
            Følg disse trin for at finde det på din enhed
          </DialogDescription>
        </DialogHeader>

        {/* Screenshot if available */}
        {screenshot && (
          <div className="mt-4 mb-2 rounded-xl overflow-hidden border border-border shadow-sm">
            <img 
              src={screenshot} 
              alt={`Guide billede: ${helpData.title}`}
              className="w-full h-auto"
              loading="lazy"
            />
          </div>
        )}

        <div className="space-y-3 mt-4">
          {helpData.steps.map((step, index) => (
            <div 
              key={index} 
              className="flex gap-3 p-4 bg-muted/50 rounded-lg border border-border/50"
            >
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                {index + 1}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground flex items-center gap-2 flex-wrap">
                  {step.icon && <StepIcon icon={step.icon} />}
                  {parseTextWithIcons(step.instruction)}
                </p>
                {step.detail && (
                  <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
                    {parseTextWithIcons(step.detail)}
                  </p>
                )}
              </div>
            </div>
          ))}

          {helpData.tip && (
            <div className="flex gap-3 p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg">
              <Lightbulb className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-amber-800 dark:text-amber-200">
                <span className="font-medium">💡 Tip:</span> {parseTextWithIcons(helpData.tip)}
              </p>
            </div>
          )}
        </div>

        <Button 
          onClick={() => onOpenChange(false)} 
          className="w-full mt-4"
          size="lg"
        >
          <CheckCircle2 className="h-4 w-4 mr-2" />
          Forstået
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export default CheckinHelpModal;