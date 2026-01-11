import { useState, useRef } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { PublicLayout } from '@/components/layout/PublicLayout';
import { useScrollRestoration } from '@/hooks/useScrollRestoration';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, Camera, Loader2, ImageIcon, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ScreenshotHelpModal } from '@/components/ui/ScreenshotHelpModal';
import { ToolPageHelpButton } from '@/components/help/ToolPageHelpButton';

const ScreenshotAI = () => {
  useScrollRestoration();

  const [image, setImage] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [explanation, setExplanation] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Vælg venligst et billede');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setImagePreview(result);
      // Remove data URL prefix for base64
      const base64 = result.split(',')[1];
      setImage(base64);
      setExplanation(null);
    };
    reader.readAsDataURL(file);
  };

  const analyzeImage = async () => {
    if (!image) return;

    setIsAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke('analyze-screenshot', {
        body: { imageBase64: image },
      });

      if (error) throw error;

      setExplanation(data.explanation);
    } catch (error) {
      console.error('Analysis error:', error);
      toast.error('Kunne ikke analysere billedet. Prøv igen.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const clearImage = () => {
    setImage(null);
    setImagePreview(null);
    setExplanation(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <ProtectedRoute requiredPlan="plus">
      <PublicLayout>
        <div className="container py-8 md:py-12">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Camera className="h-8 w-8 text-primary" />
              </div>
              <h1 className="text-3xl font-bold mb-2">Screenshot → Forklaring</h1>
              <p className="text-lg text-muted-foreground">
                Upload et billede fra din skærm, og få det forklaret i simple ord
              </p>
            </div>

            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Upload billede</CardTitle>
                <CardDescription>
                  Tag et screenshot eller vælg et billede fra din enhed
                </CardDescription>
              </CardHeader>
              <CardContent>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                  id="image-upload"
                />

                {!imagePreview ? (
                  <div>
                    <label
                      htmlFor="image-upload"
                      className="flex flex-col items-center justify-center h-64 border-2 border-dashed rounded-xl cursor-pointer hover:bg-muted/50 transition-colors"
                    >
                      <Upload className="h-12 w-12 text-muted-foreground mb-4" />
                      <p className="text-lg font-medium mb-1">Klik her for at vælge billede</p>
                      <p className="text-sm text-muted-foreground">eller træk og slip</p>
                    </label>
                    <div className="flex justify-center mt-3">
                      <ScreenshotHelpModal />
                    </div>
                  </div>
                ) : (
                  <div className="relative">
                    <img
                      src={imagePreview}
                      alt="Uploaded preview"
                      className="w-full rounded-xl max-h-80 object-contain bg-muted"
                    />
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2"
                      onClick={clearImage}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}

                {imagePreview && !explanation && (
                  <Button
                    size="xl"
                    className="w-full mt-4"
                    onClick={analyzeImage}
                    disabled={isAnalyzing}
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Analyserer billede...
                      </>
                    ) : (
                      <>
                        <ImageIcon className="mr-2 h-5 w-5" />
                        Forklar dette billede
                      </>
                    )}
                  </Button>
                )}
              </CardContent>
            </Card>

            {explanation && (
              <Card className="animate-fade-in">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <span className="text-2xl">🤖</span>
                    Forklaring
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-lg max-w-none">
                    {explanation.split('\n').map((paragraph, i) => (
                      <p key={i} className="mb-4 last:mb-0 leading-relaxed">
                        {paragraph.startsWith('**') ? (
                          <strong>{paragraph.replace(/\*\*/g, '')}</strong>
                        ) : (
                          paragraph
                        )}
                      </p>
                    ))}
                  </div>

                  <div className="mt-6 flex gap-3">
                    <Button variant="outline" onClick={clearImage} className="flex-1">
                      Analysér nyt billede
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
        <ToolPageHelpButton />
      </PublicLayout>
    </ProtectedRoute>
  );
};

export default ScreenshotAI;
