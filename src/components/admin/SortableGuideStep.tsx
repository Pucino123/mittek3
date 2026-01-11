import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { GripVertical, Trash2, Upload, X, Loader2, Video, Image as ImageIcon } from 'lucide-react';
import { ScreenshotHelpModal } from '@/components/ui/ScreenshotHelpModal';
import { useState } from 'react';

interface GuideStep {
  id: string;
  guide_id: string;
  step_number: number;
  title: string;
  instruction: string;
  image_url: string | null;
  video_url?: string | null;
  animated_gif_url?: string | null;
}

interface SortableGuideStepProps {
  step: GuideStep;
  index: number;
  onUpdateStep: (stepId: string, field: 'title' | 'instruction' | 'video_url', value: string) => void;
  onSaveStep: (step: GuideStep) => void;
  onDeleteStep: (stepId: string) => void;
  onFileSelect: (stepId: string, event: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveImage: (stepId: string) => void;
  onVideoUpload?: (stepId: string, file: File) => void;
  onRemoveVideo?: (stepId: string) => void;
  onGifUpload?: (stepId: string, file: File) => void;
  onRemoveGif?: (stepId: string) => void;
  uploadingStepId: string | null;
  uploadingVideoStepId?: string | null;
  uploadingGifStepId?: string | null;
}

export function SortableGuideStep({
  step,
  index,
  onUpdateStep,
  onSaveStep,
  onDeleteStep,
  onFileSelect,
  onRemoveImage,
  onVideoUpload,
  onRemoveVideo,
  onGifUpload,
  onRemoveGif,
  uploadingStepId,
  uploadingVideoStepId,
  uploadingGifStepId,
}: SortableGuideStepProps) {
  const [videoUrlInput, setVideoUrlInput] = useState(step.video_url || '');
  const [showVideoUrl, setShowVideoUrl] = useState(!!step.video_url);
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: step.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleVideoUrlSave = () => {
    onUpdateStep(step.id, 'video_url', videoUrlInput);
    onSaveStep({ ...step, video_url: videoUrlInput });
  };

  const handleVideoFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onVideoUpload) {
      if (!file.type.startsWith('video/')) {
        return;
      }
      onVideoUpload(step.id, file);
    }
    e.target.value = '';
  };

  const handleGifFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onGifUpload) {
      if (!file.type.includes('gif')) {
        return;
      }
      onGifUpload(step.id, file);
    }
    e.target.value = '';
  };

  const hasVideo = !!step.video_url;
  const hasImage = !!step.image_url;
  const hasGif = !!step.animated_gif_url;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`border rounded-lg p-4 space-y-4 bg-background ${isDragging ? 'shadow-lg ring-2 ring-primary' : ''}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded touch-none"
            aria-label="Træk for at omsortere"
          >
            <GripVertical className="h-5 w-5 text-muted-foreground" />
          </button>
          <h4 className="font-medium">Trin {index + 1}</h4>
          {hasVideo && (
            <span className="px-2 py-0.5 bg-info/10 text-info text-xs rounded-full flex items-center gap-1">
              <Video className="h-3 w-3" /> Video
            </span>
          )}
          {hasGif && (
            <span className="px-2 py-0.5 bg-success/10 text-success text-xs rounded-full flex items-center gap-1">
              GIF
            </span>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onDeleteStep(step.id)}
        >
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </div>

      <div className="space-y-2">
        <Label>Titel</Label>
        <Input
          value={step.title}
          onChange={(e) => onUpdateStep(step.id, 'title', e.target.value)}
          onBlur={() => onSaveStep(step)}
          placeholder="Trin titel..."
        />
      </div>

      <div className="space-y-2">
        <Label>Instruktion</Label>
        <Textarea
          value={step.instruction}
          onChange={(e) => onUpdateStep(step.id, 'instruction', e.target.value)}
          onBlur={() => onSaveStep(step)}
          placeholder="Beskriv trinnet..."
          rows={2}
        />
      </div>

      {/* Video Section */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="flex items-center gap-2">
            <Video className="h-4 w-4" />
            Video (vises i stedet for billede)
          </Label>
        </div>
        
        {step.video_url ? (
          <div className="relative">
            <div className="aspect-video rounded-lg border bg-muted overflow-hidden">
              <video
                src={step.video_url}
                className="w-full h-full object-contain"
                controls
                muted
              />
            </div>
            <Button
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2"
              onClick={() => {
                if (onRemoveVideo) onRemoveVideo(step.id);
                setVideoUrlInput('');
                setShowVideoUrl(false);
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : showVideoUrl ? (
          <div className="space-y-2">
            <div className="flex gap-2">
              <Input
                value={videoUrlInput}
                onChange={(e) => setVideoUrlInput(e.target.value)}
                placeholder="https://... eller YouTube-link"
                className="flex-1"
              />
              <Button size="sm" onClick={handleVideoUrlSave}>
                Gem
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setShowVideoUrl(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowVideoUrl(true)}
              className="flex-1"
            >
              <Video className="mr-2 h-4 w-4" />
              Indsæt video-URL
            </Button>
            {onVideoUpload && (
              <>
                <input
                  type="file"
                  accept="video/*"
                  className="hidden"
                  id={`step-video-${step.id}`}
                  onChange={handleVideoFileSelect}
                />
                <label htmlFor={`step-video-${step.id}`}>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    asChild
                    disabled={uploadingVideoStepId === step.id}
                  >
                    <span>
                      {uploadingVideoStepId === step.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Upload className="mr-2 h-4 w-4" />
                          Upload video
                        </>
                      )}
                    </span>
                  </Button>
                </label>
              </>
            )}
          </div>
        )}
      </div>

      {/* Media Type Selector: GIF or Image (only show if no video) */}
      {!hasVideo && (
        <div className="space-y-3 border-t pt-4">
          <Label className="text-sm font-medium">Medietype</Label>
          <div className="flex gap-2">
            <Button
              type="button"
              variant={hasGif ? 'default' : 'outline'}
              size="sm"
              className={`flex-1 ${hasGif ? '' : ''}`}
              onClick={() => {
                // If switching to GIF mode and has image, that's fine
                document.getElementById(`step-gif-${step.id}`)?.click();
              }}
            >
              🎬 GIF
            </Button>
            <Button
              type="button"
              variant={!hasGif && hasImage ? 'default' : 'outline'}
              size="sm"
              className="flex-1"
              onClick={() => {
                // Click the image upload
                document.getElementById(`step-image-${step.id}`)?.click();
              }}
            >
              <ImageIcon className="h-4 w-4 mr-1" />
              Billede
            </Button>
          </div>
          
          {/* GIF Preview/Upload */}
          {step.animated_gif_url && (
            <div className="relative group">
              <img
                src={step.animated_gif_url}
                alt={`GIF til trin ${index + 1}`}
                className="w-full max-h-48 object-contain rounded-lg border bg-muted/50"
              />
              <div className="absolute top-2 right-2 bg-success/90 text-success-foreground px-2 py-0.5 rounded text-xs font-medium">
                GIF (looper)
              </div>
              <Button
                variant="destructive"
                size="icon"
                className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => onRemoveGif && onRemoveGif(step.id)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
          
          {/* Hidden GIF input */}
          <input
            type="file"
            accept="image/gif"
            className="hidden"
            id={`step-gif-${step.id}`}
            onChange={handleGifFileSelect}
          />
          
          {/* Upload prompt when no media */}
          {!hasGif && !hasImage && (
            <div className="border-2 border-dashed rounded-lg p-4 text-center hover:border-primary/50 hover:bg-muted/50 transition-colors">
              <p className="text-xs text-muted-foreground mb-2">
                Vælg en medietype ovenfor for at uploade
              </p>
              {uploadingGifStepId === step.id && (
                <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
              )}
            </div>
          )}
        </div>
      )}

      {/* Image Preview - Only show if has image and no gif and no video */}
      {!hasVideo && !hasGif && hasImage && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="flex items-center gap-2">
              <ImageIcon className="h-4 w-4" />
              Billede
            </Label>
            <ScreenshotHelpModal variant="icon" />
          </div>
          <div className="relative group">
            <img
              src={step.image_url!}
              alt={`Trin ${index + 1}`}
              className="w-full max-h-64 object-contain rounded-lg border bg-muted/50"
            />
            {/* Overlay with actions */}
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => document.getElementById(`step-image-${step.id}`)?.click()}
                disabled={uploadingStepId === step.id}
              >
                {uploadingStepId === step.id ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Upload className="h-4 w-4 mr-2" />
                )}
                Erstat billede
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => onRemoveImage(step.id)}
              >
                <X className="h-4 w-4 mr-2" />
                Fjern
              </Button>
            </div>
            {/* Placeholder indicator */}
            {step.image_url?.includes('placehold.co') && (
              <div className="absolute bottom-2 left-2 bg-warning/90 text-warning-foreground px-2 py-1 rounded text-xs font-medium">
                Placeholder - upload rigtigt billede
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Hidden image input (always present for the media selector) */}
      <input
        type="file"
        accept="image/*"
        className="hidden"
        id={`step-image-${step.id}`}
        onChange={(e) => onFileSelect(step.id, e)}
      />
    </div>
  );
}
