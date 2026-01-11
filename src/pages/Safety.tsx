import { useState, useRef } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { PublicLayout } from '@/components/layout/PublicLayout';
import { Breadcrumb } from '@/components/seo/Breadcrumb';
import { useScrollRestoration } from '@/hooks/useScrollRestoration';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Shield, FileText, Image, Loader2, AlertTriangle, CheckCircle, HelpCircle, Upload, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ScreenshotHelpModal } from '@/components/ui/ScreenshotHelpModal';
import { CopyHelpModal } from '@/components/safety/CopyHelpModal';
import { ToolPageHelpButton } from '@/components/help/ToolPageHelpButton';

interface SafetyResult {
  risk: 'LAV' | 'MELLEM' | 'HØJ';
  riskExplanation: string;
  details: string[];
  recommendation: string;
}

const Safety = () => {
  // Enable scroll restoration
  useScrollRestoration();
  
  const [textInput, setTextInput] = useState('');
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<SafetyResult | null>(null);
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
      const dataUrl = event.target?.result as string;
      setImagePreview(dataUrl);
      setImageBase64(dataUrl.split(',')[1]);
      setResult(null);
    };
    reader.readAsDataURL(file);
  };

  const clearImage = () => {
    setImageBase64(null);
    setImagePreview(null);
    setResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const analyzeText = async () => {
    if (!textInput.trim()) {
      toast.error('Indsæt venligst en besked først');
      return;
    }

    setIsAnalyzing(true);
    setResult(null);
    
    try {
      const { data, error } = await supabase.functions.invoke('safety-check', {
        body: { text: textInput },
      });

      if (error) throw error;
      setResult(data);
    } catch (error) {
      console.error('Analysis error:', error);
      toast.error('Kunne ikke analysere beskeden. Prøv igen.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const analyzeImage = async () => {
    if (!imageBase64) {
      toast.error('Upload venligst et billede først');
      return;
    }

    setIsAnalyzing(true);
    setResult(null);
    
    try {
      const { data, error } = await supabase.functions.invoke('safety-check', {
        body: { imageBase64 },
      });

      if (error) throw error;
      setResult(data);
    } catch (error) {
      console.error('Analysis error:', error);
      toast.error('Kunne ikke analysere billedet. Prøv igen.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getRiskConfig = (risk: string) => {
    switch (risk) {
      case 'HØJ':
        return {
          icon: AlertTriangle,
          color: 'text-destructive',
          bg: 'bg-destructive/10',
          border: 'border-destructive/30',
          title: 'Stop! Dette ligner svindel',
        };
      case 'MELLEM':
        return {
          icon: HelpCircle,
          color: 'text-warning',
          bg: 'bg-warning/10',
          border: 'border-warning/30',
          title: 'Vær forsigtig',
        };
      default:
        return {
          icon: CheckCircle,
          color: 'text-success',
          bg: 'bg-success/10',
          border: 'border-success/30',
          title: 'Det ser sikkert ud',
        };
    }
  };

  const resetAll = () => {
    setTextInput('');
    clearImage();
    setResult(null);
  };

  return (
    <ProtectedRoute requiredPlan="plus">
      <PublicLayout>
        <div className="container py-8 md:py-12">
          <div className="max-w-2xl mx-auto">
            {/* Breadcrumb */}
            <Breadcrumb className="mb-4" />
            
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-success" />
              </div>
              <h1 className="text-3xl font-bold mb-2">Sikkerhedsskjold</h1>
              <p className="text-lg text-muted-foreground">
                Tjek om en SMS, email eller besked er svindel
              </p>
            </div>

            <Card>
              <Tabs defaultValue="text" className="w-full">
                <CardHeader>
                  <TabsList className="grid w-full grid-cols-2 h-14 max-md:h-12">
                    <TabsTrigger value="text" className="text-lg h-12 max-md:text-sm max-md:h-10">
                      <FileText className="mr-2 h-5 w-5 max-md:h-4 max-md:w-4 max-md:mr-1" />
                      Tekst-tjek
                    </TabsTrigger>
                    <TabsTrigger value="image" className="text-lg h-12 max-md:text-sm max-md:h-10">
                      <Image className="mr-2 h-5 w-5 max-md:h-4 max-md:w-4 max-md:mr-1" />
                      Billede-tjek
                    </TabsTrigger>
                  </TabsList>
                </CardHeader>

                <CardContent>
                  <TabsContent value="text" className="mt-0">
                    <div className="space-y-4">
                      <div>
                        <div className="flex flex-col items-center text-center mb-3">
                          <p className="text-sm text-muted-foreground mb-2">
                            Kopiér og indsæt den mistænkelige besked herunder:
                          </p>
                          <CopyHelpModal />
                        </div>
                        <Textarea
                          value={textInput}
                          onChange={(e) => {
                            setTextInput(e.target.value);
                            setResult(null);
                          }}
                          placeholder="Indsæt SMS eller email her..."
                          className="min-h-[150px] text-base"
                        />
                      </div>
                      <Button
                        size="xl"
                        className="w-full"
                        onClick={analyzeText}
                        disabled={isAnalyzing || !textInput.trim()}
                      >
                        {isAnalyzing ? (
                          <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            Analyserer...
                          </>
                        ) : (
                          <>
                            <Shield className="mr-2 h-5 w-5" />
                            Tjek for svindel
                          </>
                        )}
                      </Button>
                    </div>
                  </TabsContent>

                  <TabsContent value="image" className="mt-0">
                    <div className="space-y-4">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                        id="safety-image-upload"
                      />

                      {!imagePreview ? (
                        <div>
                          <label
                            htmlFor="safety-image-upload"
                            className="flex flex-col items-center justify-center h-48 border-2 border-dashed rounded-xl cursor-pointer hover:bg-muted/50 transition-colors"
                          >
                            <Upload className="h-10 w-10 text-muted-foreground mb-3" />
                            <p className="text-lg font-medium mb-1">Upload et screenshot</p>
                            <p className="text-sm text-muted-foreground">af den mistænkelige besked</p>
                          </label>
                          <div className="flex justify-center mt-3">
                            <ScreenshotHelpModal />
                          </div>
                        </div>
                      ) : (
                        <div className="relative">
                          <img
                            src={imagePreview}
                            alt="Preview"
                            className="w-full rounded-xl max-h-64 object-contain bg-muted"
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

                      <Button
                        size="xl"
                        className="w-full"
                        onClick={analyzeImage}
                        disabled={isAnalyzing || !imageBase64}
                      >
                        {isAnalyzing ? (
                          <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            Analyserer billede...
                          </>
                        ) : (
                          <>
                            <Shield className="mr-2 h-5 w-5" />
                            Tjek billede for svindel
                          </>
                        )}
                      </Button>
                    </div>
                  </TabsContent>
                </CardContent>
              </Tabs>
            </Card>

            {result && (
              <Card className={`mt-6 animate-fade-in ${getRiskConfig(result.risk).border} border-2`}>
                <CardContent className="pt-6">
                  <div className={`text-center p-6 rounded-xl ${getRiskConfig(result.risk).bg} mb-6`}>
                    {(() => {
                      const Icon = getRiskConfig(result.risk).icon;
                      return (
                        <Icon className={`h-16 w-16 mx-auto mb-4 ${getRiskConfig(result.risk).color}`} />
                      );
                    })()}
                    <h2 className={`text-2xl font-bold ${getRiskConfig(result.risk).color}`}>
                      {getRiskConfig(result.risk).title}
                    </h2>
                    <p className="mt-2 text-lg">{result.riskExplanation}</p>
                  </div>

                  {result.details && result.details.length > 0 && (
                    <div className="mb-6">
                      <h3 className="font-semibold mb-2">Hvad vi lagde mærke til:</h3>
                      <ul className="space-y-2">
                        {result.details.map((detail, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="text-primary">•</span>
                            <span>{detail}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="p-4 bg-muted rounded-xl">
                    <h3 className="font-semibold mb-1">Vores anbefaling:</h3>
                    <p className="text-lg">{result.recommendation}</p>
                  </div>

                  <Button variant="outline" className="w-full mt-6" onClick={resetAll}>
                    Tjek en ny besked
                  </Button>
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

export default Safety;
