import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Loader2, Upload, X, Image as ImageIcon, Video, Play } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface VisualHelpImage {
  id: string;
  feature_key: string;
  step_key: string;
  image_url: string | null;
  gif_url: string | null;
  video_url: string | null;
  description: string | null;
}

const features = [
  { key: 'battery_doctor', label: 'Batteri-Doktor' },
  { key: 'medical_id', label: 'Digitalt Nødkort' },
  { key: 'guest_wifi', label: 'Gæste Wi-Fi' },
];

export function VisualHelpManager() {
  const [items, setItems] = useState<VisualHelpImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [uploadType, setUploadType] = useState<'image' | 'gif' | 'video' | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('visual_help_images')
        .select('*')
        .order('feature_key', { ascending: true })
        .order('sort_order', { ascending: true });

      if (error) throw error;
      setItems(data || []);
    } catch (error) {
      console.error('Fetch error:', error);
      toast.error('Kunne ikke hente visuelle hjælpebilleder');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelect = (id: string, type: 'image' | 'gif' | 'video', event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (type === 'video' && !file.type.startsWith('video/')) {
      toast.error('Kun videoer er tilladt');
      return;
    }
    if ((type === 'image' || type === 'gif') && !file.type.startsWith('image/')) {
      toast.error('Kun billeder er tilladt');
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      toast.error('Fil er for stor (max 50MB)');
      return;
    }

    uploadFile(id, type, file);
    event.target.value = '';
  };

  const uploadFile = async (id: string, type: 'image' | 'gif' | 'video', file: File) => {
    setUploadingId(id);
    setUploadType(type);

    try {
      const fileExt = file.name.split('.').pop();
      const folderName = type === 'video' ? 'videos' : type === 'gif' ? 'gifs' : 'images';
      const fileName = `visual-help-${id}-${type}-${Date.now()}.${fileExt}`;
      const filePath = `${folderName}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('guide-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('guide-images')
        .getPublicUrl(filePath);

      const updateField = type === 'video' ? 'video_url' : type === 'gif' ? 'gif_url' : 'image_url';
      const { error: updateError } = await supabase
        .from('visual_help_images')
        .update({ [updateField]: publicUrl })
        .eq('id', id);

      if (updateError) throw updateError;

      setItems(prev => 
        prev.map(item => item.id === id ? { ...item, [updateField]: publicUrl } : item)
      );

      toast.success(`${type === 'video' ? 'Video' : type === 'gif' ? 'GIF' : 'Billede'} uploadet`);
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Kunne ikke uploade fil');
    } finally {
      setUploadingId(null);
      setUploadType(null);
    }
  };

  const removeFile = async (id: string, type: 'image' | 'gif' | 'video') => {
    try {
      const updateField = type === 'video' ? 'video_url' : type === 'gif' ? 'gif_url' : 'image_url';
      const { error } = await supabase
        .from('visual_help_images')
        .update({ [updateField]: null })
        .eq('id', id);

      if (error) throw error;

      setItems(prev => 
        prev.map(item => item.id === id ? { ...item, [updateField]: null } : item)
      );

      toast.success('Fil fjernet');
    } catch (error) {
      console.error('Remove error:', error);
      toast.error('Kunne ikke fjerne fil');
    }
  };

  const getFeatureItems = (featureKey: string) => {
    return items.filter(item => item.feature_key === featureKey);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ImageIcon className="h-5 w-5" />
          Visuel Hjælp
        </CardTitle>
        <CardDescription>
          Upload billeder, GIFs og videoer til Batteri-Doktor, Digitalt Nødkort og Gæste Wi-Fi
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="battery_doctor">
          <TabsList className="mb-4">
            {features.map(feature => (
              <TabsTrigger key={feature.key} value={feature.key}>
                {feature.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {features.map(feature => (
            <TabsContent key={feature.key} value={feature.key}>
              <div className="space-y-4">
                {getFeatureItems(feature.key).length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground">
                    Ingen visuelle hjælpebilleder for denne funktion
                  </p>
                ) : (
                  getFeatureItems(feature.key).map(item => (
                    <div key={item.id} className="border rounded-lg p-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <Badge variant="outline" className="mb-1">{item.step_key}</Badge>
                          <p className="text-sm text-muted-foreground">{item.description}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Image upload */}
                        <div className="space-y-2">
                          <Label className="text-xs">Billede</Label>
                          {item.image_url ? (
                            <div className="relative">
                              <img 
                                src={item.image_url} 
                                alt={item.description || ''} 
                                className="w-full h-32 object-cover rounded-lg"
                              />
                              <Button
                                variant="destructive"
                                size="icon"
                                className="absolute top-1 right-1 h-6 w-6"
                                onClick={() => removeFile(item.id, 'image')}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ) : (
                            <div className="relative">
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                id={`image-${item.id}`}
                                onChange={(e) => handleFileSelect(item.id, 'image', e)}
                              />
                              <label
                                htmlFor={`image-${item.id}`}
                                className="flex flex-col items-center justify-center h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                              >
                                {uploadingId === item.id && uploadType === 'image' ? (
                                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                ) : (
                                  <>
                                    <Upload className="h-6 w-6 text-muted-foreground mb-1" />
                                    <span className="text-xs text-muted-foreground">Upload billede</span>
                                  </>
                                )}
                              </label>
                            </div>
                          )}
                        </div>

                        {/* GIF upload */}
                        <div className="space-y-2">
                          <Label className="text-xs">GIF</Label>
                          {item.gif_url ? (
                            <div className="relative">
                              <img 
                                src={item.gif_url} 
                                alt={`${item.description} (GIF)`} 
                                className="w-full h-32 object-cover rounded-lg"
                              />
                              <Button
                                variant="destructive"
                                size="icon"
                                className="absolute top-1 right-1 h-6 w-6"
                                onClick={() => removeFile(item.id, 'gif')}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ) : (
                            <div className="relative">
                              <input
                                type="file"
                                accept="image/gif"
                                className="hidden"
                                id={`gif-${item.id}`}
                                onChange={(e) => handleFileSelect(item.id, 'gif', e)}
                              />
                              <label
                                htmlFor={`gif-${item.id}`}
                                className="flex flex-col items-center justify-center h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                              >
                                {uploadingId === item.id && uploadType === 'gif' ? (
                                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                ) : (
                                  <>
                                    <Play className="h-6 w-6 text-muted-foreground mb-1" />
                                    <span className="text-xs text-muted-foreground">Upload GIF</span>
                                  </>
                                )}
                              </label>
                            </div>
                          )}
                        </div>

                        {/* Video upload */}
                        <div className="space-y-2">
                          <Label className="text-xs">Video</Label>
                          {item.video_url ? (
                            <div className="relative">
                              <video 
                                src={item.video_url}
                                className="w-full h-32 object-cover rounded-lg"
                                controls
                              />
                              <Button
                                variant="destructive"
                                size="icon"
                                className="absolute top-1 right-1 h-6 w-6"
                                onClick={() => removeFile(item.id, 'video')}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ) : (
                            <div className="relative">
                              <input
                                type="file"
                                accept="video/*"
                                className="hidden"
                                id={`video-${item.id}`}
                                onChange={(e) => handleFileSelect(item.id, 'video', e)}
                              />
                              <label
                                htmlFor={`video-${item.id}`}
                                className="flex flex-col items-center justify-center h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                              >
                                {uploadingId === item.id && uploadType === 'video' ? (
                                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                ) : (
                                  <>
                                    <Video className="h-6 w-6 text-muted-foreground mb-1" />
                                    <span className="text-xs text-muted-foreground">Upload video</span>
                                  </>
                                )}
                              </label>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
}
