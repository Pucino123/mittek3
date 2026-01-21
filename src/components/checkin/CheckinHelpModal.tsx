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

export interface HelpStep {
  instruction: string;
  detail?: string;
  icon?: string;
  image_url?: string;
  video_url?: string;
}

export interface CheckinHelpData {
  title: string;
  steps: HelpStep[];
  tip?: string;
  screenshot?: string;
  video?: string;
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

const CheckinHelpModal: React.FC<CheckinHelpModalProps> = ({
  open,
  onOpenChange,
  helpData
}) => {
  if (!helpData) return null;

  // Check if there's a video or screenshot from database (URLs start with http)
  const hasVideo = helpData.video && helpData.video.startsWith('http');
  const hasScreenshot = helpData.screenshot && helpData.screenshot.startsWith('http');

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

        {/* Video if available (priority over screenshot) */}
        {hasVideo && (
          <div className="mt-4 mb-2 rounded-xl overflow-hidden border border-border shadow-sm">
            <video 
              src={helpData.video}
              controls
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-auto"
            />
          </div>
        )}

        {/* Screenshot if available and no video */}
        {!hasVideo && hasScreenshot && (
          <div className="mt-4 mb-2 rounded-xl overflow-hidden border border-border shadow-sm">
            <img 
              src={helpData.screenshot} 
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
              className="flex flex-col gap-2 p-4 bg-muted/50 rounded-lg border border-border/50"
            >
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground flex items-center gap-2 flex-wrap">
                    {step.icon && <StepIcon icon={step.icon} />}
                    {step.instruction}
                  </p>
                  {step.detail && (
                    <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
                      {step.detail}
                    </p>
                  )}
                </div>
              </div>
              
              {/* Step video or image */}
              {step.video_url && (
                <div className="ml-11 rounded-lg overflow-hidden border">
                  <video 
                    src={step.video_url}
                    controls
                    muted
                    playsInline
                    className="w-full h-auto max-h-48"
                  />
                </div>
              )}
              {!step.video_url && step.image_url && (
                <div className="ml-11 rounded-lg overflow-hidden border">
                  <img 
                    src={step.image_url}
                    alt={`Trin ${index + 1}`}
                    className="w-full h-auto max-h-48 object-contain"
                    loading="lazy"
                  />
                </div>
              )}
            </div>
          ))}

          {helpData.tip && (
            <div className="flex gap-3 p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg">
              <Lightbulb className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-amber-800 dark:text-amber-200">
                <span className="font-medium">💡 Tip:</span> {helpData.tip}
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
