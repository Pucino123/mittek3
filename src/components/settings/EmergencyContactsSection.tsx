import { useState, useEffect } from 'react';
import { Phone, CreditCard, HeartHandshake, Save, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const EmergencyContactsSection = () => {
  const { user, profile, refetchProfile } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [bankPhone, setBankPhone] = useState('');
  const [helperPhone, setHelperPhone] = useState('');
  const [helperName, setHelperName] = useState('');

  useEffect(() => {
    if (profile) {
      setBankPhone(profile.emergency_bank_phone || '');
      setHelperPhone(profile.emergency_helper_phone || '');
      setHelperName(profile.emergency_helper_name || '');
    }
  }, [profile]);

  const handleSave = async () => {
    if (!user) return;
    
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          emergency_bank_phone: bankPhone || null,
          emergency_helper_phone: helperPhone || null,
          emergency_helper_name: helperName || null,
        })
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      // Refetch profile to update context with new values
      await refetchProfile();
      
      toast.success('Nødkontakter gemt!');
    } catch (error) {
      console.error('Error saving emergency contacts:', error);
      toast.error('Kunne ikke gemme. Prøv igen.');
    } finally {
      setIsSaving(false);
    }
  };

  const formatPhoneNumber = (value: string) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, '');
    return digits;
  };

  return (
    <div id="emergency-section" className="card-elevated p-6 mb-6 scroll-mt-24 transition-all duration-500">
      <h3 className="font-semibold mb-2 flex items-center gap-2">
        <Phone className="h-5 w-5" />
        Nødkontakter
      </h3>
      <p className="text-sm text-muted-foreground mb-6">
        Gem vigtige telefonnumre, så du hurtigt kan ringe ved problemer
      </p>

      <div className="space-y-5">
        {/* Bank Phone */}
        <div className="space-y-2">
          <Label htmlFor="bank-phone" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-muted-foreground" />
            Din banks nødnummer
          </Label>
          <Input
            id="bank-phone"
            type="tel"
            placeholder="F.eks. 70101043"
            value={bankPhone}
            onChange={(e) => setBankPhone(formatPhoneNumber(e.target.value))}
            className="h-12"
          />
          <p className="text-xs text-muted-foreground">
            Find nummeret bag på dit betalingskort
          </p>
        </div>

        {/* Helper Name */}
        <div className="space-y-2">
          <Label htmlFor="helper-name" className="flex items-center gap-2">
            <HeartHandshake className="h-4 w-4 text-muted-foreground" />
            Hjælperens navn
          </Label>
          <Input
            id="helper-name"
            type="text"
            placeholder="F.eks. Peter (min søn)"
            value={helperName}
            onChange={(e) => setHelperName(e.target.value)}
            className="h-12"
          />
        </div>

        {/* Helper Phone */}
        <div className="space-y-2">
          <Label htmlFor="helper-phone" className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-muted-foreground" />
            Hjælperens telefonnummer
          </Label>
          <Input
            id="helper-phone"
            type="tel"
            placeholder="F.eks. 12345678"
            value={helperPhone}
            onChange={(e) => setHelperPhone(formatPhoneNumber(e.target.value))}
            className="h-12"
          />
          <p className="text-xs text-muted-foreground">
            En person du stoler på, der kan hjælpe med teknik
          </p>
        </div>

        <Button
          variant="hero"
          size="lg"
          className="w-full"
          onClick={handleSave}
          disabled={isSaving}
        >
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Gemmer...
            </>
          ) : (
            <>
              <Save className="mr-2 h-5 w-5" />
              Gem nødkontakter
            </>
          )}
        </Button>
      </div>
    </div>
  );
};
