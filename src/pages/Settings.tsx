import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { IOSSwitch } from '@/components/ui/ios-switch';
import { 
  User,
  Eye,
  LogOut,
  ChevronRight,
  CreditCard,
  Check,
  Lock,
  Camera,
  Sparkles,
  Shield,
  Loader2,
  Smartphone,
  Tablet,
  Monitor,
  Cookie,
  Upload,
  X
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useSeniorMode } from '@/contexts/SeniorModeContext';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { TrustedHelperSection } from '@/components/settings/TrustedHelperSection';
import { EmergencyContactsSection } from '@/components/settings/EmergencyContactsSection';
import { BackButton } from '@/components/layout/BackButton';
import { getCookieConsent, resetCookieConsent } from '@/components/ui/CookieConsent';
import { Breadcrumb } from '@/components/seo/Breadcrumb';
import { CheckHistoryWidget } from '@/components/dashboard/CheckHistoryWidget';

type DeviceType = 'iphone' | 'ipad' | 'mac';

const Settings = () => {
  const { profile, subscription, signOut, user, refetchProfile, refetchSubscription } = useAuth();
  const { seniorMode, toggleSeniorMode } = useSeniorMode();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isUpgradeLoading, setIsUpgradeLoading] = useState(false);
  // Only initialize local state AFTER profile has loaded (avoid overwriting with defaults)
  const [devicePreference, setDevicePreference] = useState<DeviceType | null>(null);
  const [ownedDevices, setOwnedDevices] = useState<DeviceType[] | null>(null);
  const [isSavingDevice, setIsSavingDevice] = useState(false);
  const [cookieConsent, setCookieConsent] = useState(getCookieConsent());
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [profileLoaded, setProfileLoaded] = useState(false);

  // Force refetch subscription on mount to clear stale cache
  useEffect(() => {
    refetchSubscription();
  }, [refetchSubscription]);

  // Ensure profile exists on mount (for users missing profile row)
  useEffect(() => {
    if (user && !profile) {
      refetchProfile();
    }
  }, [user, profile, refetchProfile]);

  // Handle scroll-to-section from URL params
  useEffect(() => {
    const scrollTo = searchParams.get('scrollTo');
    if (scrollTo) {
      // Small delay to ensure DOM is ready
      const timer = setTimeout(() => {
        const element = document.getElementById(scrollTo);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          
          // Add highlight animation
          element.classList.add('ring-2', 'ring-primary', 'ring-offset-2', 'ring-offset-background');
          setTimeout(() => {
            element.classList.remove('ring-2', 'ring-primary', 'ring-offset-2', 'ring-offset-background');
          }, 2000);
          
          // Clean up URL params
          setSearchParams({}, { replace: true });
        }
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, [searchParams, setSearchParams]);

  const isBasicPlan = !subscription || subscription.plan_tier === 'basic';

  // Update device preference when profile loads - ONLY set state once profile is available
  useEffect(() => {
    if (profile) {
      setDevicePreference((profile.device_preference as DeviceType) || 'iphone');
      setOwnedDevices((profile.owned_devices as DeviceType[]) || ['iphone']);
      setProfileLoaded(true);
    }
  }, [profile]);

  // Toggle a device in owned_devices array
  const handleDeviceToggle = async (device: DeviceType) => {
    if (!user || !profileLoaded || !ownedDevices) return;
    
    setIsSavingDevice(true);
    
    // Calculate new owned devices list
    let newOwnedDevices: DeviceType[];
    if (ownedDevices.includes(device)) {
      // Don't allow removing the last device
      if (ownedDevices.length === 1) {
        toast.error('Du skal have mindst én enhed valgt');
        setIsSavingDevice(false);
        return;
      }
      newOwnedDevices = ownedDevices.filter(d => d !== device);
    } else {
      newOwnedDevices = [...ownedDevices, device];
    }
    
    // Update primary device preference to first owned device
    const newPrimaryDevice = newOwnedDevices[0];
    
    setOwnedDevices(newOwnedDevices);
    setDevicePreference(newPrimaryDevice);
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          owned_devices: newOwnedDevices,
          device_preference: newPrimaryDevice 
        })
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      // Mark that user has interacted with device settings (for onboarding tracker)
      localStorage.setItem('device-settings-interacted', 'true');
      
      // Refetch profile to update all components immediately
      await refetchProfile();
      
      toast.success('Enheder opdateret – alle funktioner tilpasses nu');
    } catch (error) {
      console.error('Error updating devices:', error);
      toast.error('Kunne ikke gemme enhederne');
      // Revert on error
      setOwnedDevices((profile?.owned_devices as DeviceType[]) || ['iphone']);
      setDevicePreference((profile?.device_preference as DeviceType) || 'iphone');
    } finally {
      setIsSavingDevice(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    toast.success('Du er nu logget ud');
    navigate('/');
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Vælg venligst et billede');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Billedet må max være 5MB');
      return;
    }

    setIsUploadingAvatar(true);
    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/avatar.${fileExt}`;

      // Upload file
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Create signed URL that expires in 1 year (bucket is now private for security)
      const { data: signedUrlData, error: signedUrlError } = await supabase.storage
        .from('avatars')
        .createSignedUrl(filePath, 60 * 60 * 24 * 365); // 1 year expiry

      if (signedUrlError) throw signedUrlError;

      // Update profile with signed URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: signedUrlData.signedUrl })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      await refetchProfile();
      toast.success('Profilbillede opdateret');
    } catch (error) {
      console.error('Avatar upload error:', error);
      toast.error('Kunne ikke uploade billede');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleUpgradeToPlus = async () => {
    setIsUpgradeLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { planTier: 'plus' },
      });

      if (error) throw error;
      
      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error('Ingen checkout URL modtaget');
      }
    } catch (error) {
      console.error('Upgrade error:', error);
      toast.error('Der opstod en fejl. Prøv igen.');
    } finally {
      setIsUpgradeLoading(false);
    }
  };

  const planLabels = {
    basic: 'Basic',
    plus: 'Plus',
    pro: 'Pro',
  };

  const currentPlan = subscription?.plan_tier || 'basic';

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="container flex h-18 items-center px-4">
          <BackButton />
        </div>
      </header>

      <main className="container py-6 md:py-8 px-4">
        <div className="max-w-2xl mx-auto">
          {/* Breadcrumb Navigation */}
          <div className="mb-4">
            <Breadcrumb />
          </div>

          <h1 className="text-xl md:text-2xl font-bold mb-6 md:mb-8">Indstillinger</h1>

          {/* Account Section */}
          <div className="card-elevated p-6 mb-6">
            <div className="flex items-center gap-4">
              <div className="relative group">
                {(profile as any)?.avatar_url ? (
                  <img 
                    src={(profile as any).avatar_url} 
                    alt="Profilbillede" 
                    className="w-16 h-16 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-8 w-8 text-primary" />
                  </div>
                )}
                <button
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={isUploadingAvatar}
                  className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  {isUploadingAvatar ? (
                    <Loader2 className="h-5 w-5 text-white animate-spin" />
                  ) : (
                    <Camera className="h-5 w-5 text-white" />
                  )}
                </button>
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
              </div>
              <div className="flex-1">
                <h2 className="font-semibold text-lg">{profile?.display_name || 'Bruger'}</h2>
                <p className="text-muted-foreground">{profile?.email}</p>
              </div>
            </div>
          </div>

          {/* Subscription Section */}
          <div className="card-elevated p-6 mb-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Dit abonnement
            </h3>
            
            <div className="p-4 rounded-lg bg-muted mb-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="font-medium text-lg">
                    {planLabels[currentPlan as keyof typeof planLabels]}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {subscription?.status === 'active' 
                      ? 'Aktivt abonnement' 
                      : subscription?.status === 'trialing' 
                        ? 'Prøveperiode' 
                        : 'Inaktivt'}
                  </p>
                </div>
                <div className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
                  {currentPlan === 'basic' ? '39 kr./md' : currentPlan === 'plus' ? '79 kr./md' : '99 kr./md'}
                </div>
              </div>
              
              {/* Trial Progress Bar */}
              {subscription?.status === 'trialing' && subscription?.trial_end && (
                (() => {
                  const trialEnd = new Date(subscription.trial_end);
                  const trialStart = (subscription as { trial_start?: string }).trial_start 
                    ? new Date((subscription as { trial_start?: string }).trial_start!) 
                    : new Date(trialEnd.getTime() - 14 * 24 * 60 * 60 * 1000);
                  const now = new Date();
                  const totalDays = 14;
                  const daysElapsed = Math.floor((now.getTime() - trialStart.getTime()) / (1000 * 60 * 60 * 24));
                  const daysRemaining = Math.max(0, Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
                  const progressPercent = Math.min(100, Math.max(0, (daysElapsed / totalDays) * 100));
                  
                  return (
                    <div className="mt-3 pt-3 border-t border-border/50">
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className="text-muted-foreground">Prøveperiode</span>
                        <span className="font-medium text-primary">
                          {daysRemaining} {daysRemaining === 1 ? 'dag' : 'dage'} tilbage
                        </span>
                      </div>
                      <div className="h-2 bg-secondary rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary rounded-full transition-all duration-500"
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {daysElapsed} af {totalDays} dage brugt
                      </p>
                    </div>
                  );
                })()
              )}
            </div>

            {/* Manage Button - for all users with subscription */}
            {subscription && (
              <Button
                variant="outline"
                size="lg"
                className="w-full"
                onClick={() => navigate('/settings/subscription')}
              >
                Administrer abonnement
                <ChevronRight className="ml-2 h-5 w-5" />
              </Button>
            )}
          </div>

          {/* Upsell Card - Only for Basic users */}
          {isBasicPlan && (
            <div className="card-elevated p-6 mb-6 ring-2 ring-primary shadow-lg shadow-primary/10 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2" />
              
              <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Få fuld tryghed med Plus</h3>
                  <p className="text-muted-foreground text-sm">
                    Opgrader og få adgang til alle sikkerhedsfunktioner
                  </p>
                </div>
              </div>

              <ul className="space-y-3 mb-6">
                <li className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-success/10 flex items-center justify-center flex-shrink-0">
                    <Check className="h-4 w-4 text-success" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Lock className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Krypteret Kode-mappe</span>
                  </div>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-success/10 flex items-center justify-center flex-shrink-0">
                    <Check className="h-4 w-4 text-success" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Svindel-tjek (Sikkerhedsskjold)</span>
                  </div>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-success/10 flex items-center justify-center flex-shrink-0">
                    <Check className="h-4 w-4 text-success" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Camera className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">AI Screenshot-hjælp</span>
                  </div>
                </li>
              </ul>

              <Button
                variant="hero"
                size="xl"
                className="w-full"
                onClick={handleUpgradeToPlus}
                disabled={isUpgradeLoading}
              >
                {isUpgradeLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Vent venligst...
                  </>
                ) : (
                  <>
                    Opgrader til Plus (79 kr./md)
                    <ChevronRight className="ml-2 h-5 w-5" />
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Device Preference - Multi-Select Cards */}
          <div id="device-preference" className="card-elevated p-4 md:p-6 mb-6">
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <Smartphone className="h-5 w-5" />
              Mine Enheder
            </h3>
            <p className="text-sm text-muted-foreground mb-5">
              Vælg alle de enheder du bruger – tjek og guides tilpasses hver enhed
            </p>
            
            {/* Multi-Select Device Cards - responsive grid */}
            {!profileLoaded || !ownedDevices ? (
              <div className="flex items-center justify-center py-8 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                Indlæser enheder...
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                <button
                  onClick={() => handleDeviceToggle('iphone')}
                  disabled={isSavingDevice}
                  className={`relative flex flex-col items-center gap-2 sm:gap-3 p-3 sm:p-5 rounded-xl border-2 transition-all min-h-[80px] sm:min-h-[100px] ${
                    ownedDevices.includes('iphone')
                      ? 'border-primary bg-primary/5 shadow-md'
                      : 'border-border [@media(hover:hover)]:hover:border-primary/50 [@media(hover:hover)]:hover:bg-muted/50'
                  }`}
                >
                  {ownedDevices.includes('iphone') && (
                    <div className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-primary flex items-center justify-center">
                      <Check className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-primary-foreground" />
                    </div>
                  )}
                  <Smartphone className={`h-6 w-6 sm:h-8 sm:w-8 ${ownedDevices.includes('iphone') ? 'text-primary' : 'text-muted-foreground'}`} />
                  <span className={`font-medium text-xs sm:text-base ${ownedDevices.includes('iphone') ? 'text-primary' : ''}`}>
                    iPhone
                  </span>
                </button>
                
                <button
                  onClick={() => handleDeviceToggle('ipad')}
                  disabled={isSavingDevice}
                  className={`relative flex flex-col items-center gap-2 sm:gap-3 p-3 sm:p-5 rounded-xl border-2 transition-all min-h-[80px] sm:min-h-[100px] ${
                    ownedDevices.includes('ipad')
                      ? 'border-primary bg-primary/5 shadow-md'
                      : 'border-border [@media(hover:hover)]:hover:border-primary/50 [@media(hover:hover)]:hover:bg-muted/50'
                  }`}
                >
                  {ownedDevices.includes('ipad') && (
                    <div className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-primary flex items-center justify-center">
                      <Check className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-primary-foreground" />
                    </div>
                  )}
                  <Tablet className={`h-6 w-6 sm:h-8 sm:w-8 ${ownedDevices.includes('ipad') ? 'text-primary' : 'text-muted-foreground'}`} />
                  <span className={`font-medium text-xs sm:text-base ${ownedDevices.includes('ipad') ? 'text-primary' : ''}`}>
                    iPad
                  </span>
                </button>
                
                <button
                  onClick={() => handleDeviceToggle('mac')}
                  disabled={isSavingDevice}
                  className={`relative flex flex-col items-center gap-2 sm:gap-3 p-3 sm:p-5 rounded-xl border-2 transition-all min-h-[80px] sm:min-h-[100px] ${
                    ownedDevices.includes('mac')
                      ? 'border-primary bg-primary/5 shadow-md'
                      : 'border-border [@media(hover:hover)]:hover:border-primary/50 [@media(hover:hover)]:hover:bg-muted/50'
                  }`}
                >
                  {ownedDevices.includes('mac') && (
                    <div className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-primary flex items-center justify-center">
                      <Check className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-primary-foreground" />
                    </div>
                  )}
                  <Monitor className={`h-6 w-6 sm:h-8 sm:w-8 ${ownedDevices.includes('mac') ? 'text-primary' : 'text-muted-foreground'}`} />
                  <span className={`font-medium text-xs sm:text-base ${ownedDevices.includes('mac') ? 'text-primary' : ''}`}>
                    Mac
                  </span>
                </button>
              </div>
            )}
            
            {isSavingDevice && (
              <p className="text-sm text-muted-foreground mt-3 text-center flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Gemmer...
              </p>
            )}
            
            {ownedDevices && ownedDevices.length > 1 && (
              <p className="text-xs text-muted-foreground mt-3 text-center">
                ✓ Månedligt Tjek viser opgaver for {ownedDevices.length} enheder
              </p>
            )}
          </div>

          {/* Display Settings */}
          <div className="card-elevated p-6 mb-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Visning
            </h3>
            
            <div className="flex items-center justify-between p-4 rounded-lg bg-muted">
              <div className="flex-1 mr-4">
                <p className="font-medium">Senior-tilstand</p>
                <p className="text-sm text-muted-foreground">
                  Større tekst, mere afstand, højere kontrast
                </p>
              </div>
              <IOSSwitch
                checked={seniorMode}
                onCheckedChange={toggleSeniorMode}
              />
            </div>
          </div>

          {/* Monthly Check History */}
          <CheckHistoryWidget />

          {/* Trusted Helper */}
          <TrustedHelperSection />

          {/* Emergency Contacts */}
          <EmergencyContactsSection />

          {/* Cookie Settings */}
          <div className="card-elevated p-6 mb-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Cookie className="h-5 w-5" />
              Cookie-indstillinger
            </h3>
            
            <div className="p-4 rounded-lg bg-muted mb-4">
              <div className="flex items-center justify-between mb-2">
                <p className="font-medium">Nuværende valg</p>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  cookieConsent === 'accepted' 
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                    : cookieConsent === 'declined'
                    ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400'
                    : 'bg-muted-foreground/20 text-muted-foreground'
                }`}>
                  {cookieConsent === 'accepted' 
                    ? 'Alle cookies accepteret' 
                    : cookieConsent === 'declined'
                    ? 'Kun nødvendige'
                    : 'Ikke valgt'}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                {cookieConsent === 'accepted' 
                  ? 'Du har accepteret alle cookies, inkl. statistik-cookies.'
                  : cookieConsent === 'declined'
                  ? 'Du har kun accepteret nødvendige cookies.'
                  : 'Du har endnu ikke truffet et valg.'}
              </p>
            </div>

            <Button
              variant="outline"
              size="lg"
              className="w-full"
              onClick={() => {
                resetCookieConsent();
                setCookieConsent(null);
                toast.success('Cookie-valg nulstillet. Genindlæs siden for at se banneret.');
              }}
            >
              Nulstil cookie-valg
            </Button>
            
            <p className="text-xs text-muted-foreground mt-3 text-center">
              Efter nulstilling vil cookie-banneret vises igen ved næste sidevisning.
            </p>
          </div>

          {/* Sign Out */}
          <Button
            variant="outline"
            size="lg"
            className="w-full text-destructive hover:text-destructive mb-8"
            onClick={handleSignOut}
          >
            <LogOut className="mr-2 h-5 w-5" />
            Log ud
          </Button>

          {/* Version Footer */}
          <p className="text-center text-sm text-muted-foreground">
            MitTek Version 1.0
          </p>
        </div>
      </main>
    </div>
  );
};

export default Settings;