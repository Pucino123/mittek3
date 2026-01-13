import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Heart, Check, AlertTriangle, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface HelperHealthWidgetProps {
  relationId: string;
  personName: string;
  medicalIdVerified: boolean;
  medicalIdVerifiedAt: string | null;
  onUpdate: () => void;
}

export const HelperHealthWidget = ({
  relationId,
  personName,
  medicalIdVerified,
  medicalIdVerifiedAt,
  onUpdate,
}: HelperHealthWidgetProps) => {
  const [isUpdating, setIsUpdating] = useState(false);

  const handleVerify = async (verified: boolean) => {
    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('trusted_helpers')
        .update({
          medical_id_verified: verified,
          medical_id_verified_at: verified ? new Date().toISOString() : null,
        })
        .eq('id', relationId);

      if (error) throw error;

      toast.success(verified ? 'Nød-ID markeret som opsat' : 'Status opdateret');
      onUpdate();
    } catch (error) {
      console.error('Update error:', error);
      toast.error('Kunne ikke opdatere status');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="card-elevated p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
          medicalIdVerified ? 'bg-success/10' : 'bg-warning/10'
        }`}>
          <Heart className={`h-5 w-5 ${medicalIdVerified ? 'text-success' : 'text-warning'}`} />
        </div>
        <div>
          <h3 className="font-semibold">Nød-ID på telefonen</h3>
          <p className="text-sm text-muted-foreground">
            Har {personName} opsat Nød-ID?
          </p>
        </div>
      </div>

      {medicalIdVerified ? (
        <div className="bg-success/10 rounded-lg p-4 flex items-center gap-3">
          <Check className="h-5 w-5 text-success" />
          <div className="flex-1">
            <p className="text-sm font-medium text-success">Bekræftet opsat</p>
            {medicalIdVerifiedAt && (
              <p className="text-xs text-muted-foreground">
                Tjekket d. {new Date(medicalIdVerifiedAt).toLocaleDateString('da-DK')}
              </p>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleVerify(false)}
            disabled={isUpdating}
          >
            Nulstil
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Tjek venligst fysisk på {personName}s telefon, om Nød-ID er opsat korrekt.
          </p>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              size="sm"
              className="w-full sm:w-auto"
              onClick={() => handleVerify(false)}
              disabled={isUpdating}
            >
              {isUpdating ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <AlertTriangle className="h-4 w-4 mr-2 text-warning" />
              )}
              <span className="truncate">Ikke opsat</span>
            </Button>
            <Button
              variant="default"
              size="sm"
              className="w-full sm:w-auto bg-success hover:bg-success/90"
              onClick={() => handleVerify(true)}
              disabled={isUpdating}
            >
              {isUpdating ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Check className="h-4 w-4 mr-2" />
              )}
              <span className="truncate">Ja, opsat</span>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default HelperHealthWidget;
