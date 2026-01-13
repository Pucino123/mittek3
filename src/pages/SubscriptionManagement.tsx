import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { 
  Check,
  ChevronRight,
  CreditCard,
  Crown,
  Download,
  ExternalLink,
  HelpCircle,
  Loader2,
  Receipt,
  Sparkles,
  Star
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { BackButton } from '@/components/layout/BackButton';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { da } from 'date-fns/locale';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

interface Plan {
  id: 'basic' | 'plus' | 'pro';
  name: string;
  price: number;
  features: string[];
  icon: React.ReactNode;
  popular?: boolean;
}

interface Invoice {
  id: string;
  date: string;
  amount: number;
  currency: string;
  status: string;
  pdf_url: string | null;
  hosted_invoice_url: string | null;
}

interface PaymentMethod {
  brand: string;
  last4: string;
  exp_month: number;
  exp_year: number;
}

interface SubscriptionData {
  id: string;
  plan_tier: 'basic' | 'plus' | 'pro';
  status: 'active' | 'past_due' | 'canceled' | 'incomplete' | 'trialing';
  current_period_end: string | null;
  cancel_at_period_end: boolean | null;
  stripe_subscription_id: string | null;
  stripe_customer_id: string | null;
}

const plans: Plan[] = [
  {
    id: 'basic',
    name: 'Basic',
    price: 39,
    features: [
      'Adgang til guider',
      'Månedligt tjek-ind',
      'Teknisk ordbog',
    ],
    icon: <Star className="h-5 w-5" />,
  },
  {
    id: 'plus',
    name: 'Plus',
    price: 79,
    features: [
      'Alt fra Basic',
      'Krypteret Kode-mappe',
      'AI Screenshot-hjælp',
      'Svindel-tjek',
    ],
    icon: <Sparkles className="h-5 w-5" />,
    popular: true,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 99,
    features: [
      'Alt fra Plus',
      'Hjælper-adgang',
      'Prioriteret support',
      'Udvidet sikkerhed',
    ],
    icon: <Crown className="h-5 w-5" />,
  },
];

const SubscriptionManagement = () => {
  const { subscription: authSubscription, user, refetchSubscription } = useAuth();
  const navigate = useNavigate();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [isChangingPlan, setIsChangingPlan] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  const [isLoadingInvoices, setIsLoadingInvoices] = useState(true);
  const [isLoadingPaymentMethod, setIsLoadingPaymentMethod] = useState(true);
  const [isUpdatingPayment, setIsUpdatingPayment] = useState(false);
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [isLinkingStripe, setIsLinkingStripe] = useState(false);

  const currentPlan = subscription?.plan_tier || authSubscription?.plan_tier || 'basic';
  const cancelAtPeriodEnd = subscription?.cancel_at_period_end ?? false;
  const isLegacySubscription = subscription && !subscription.stripe_subscription_id;

  useEffect(() => {
    fetchSubscriptionData();
    fetchInvoices();
    fetchPaymentMethod();
  }, []);

  const fetchSubscriptionData = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .in('status', ['active', 'trialing'])
      .order('created_at', { ascending: false })
      .maybeSingle();
    
    if (data && !error) {
      setSubscription(data as SubscriptionData);
    }
  };

  const fetchInvoices = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('manage-subscription', {
        body: { action: 'get_invoices' },
      });

      if (error) throw error;
      setInvoices(data.invoices || []);
    } catch (error) {
      console.error('Error fetching invoices:', error);
    } finally {
      setIsLoadingInvoices(false);
    }
  };

  const fetchPaymentMethod = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('manage-subscription', {
        body: { action: 'get_payment_method' },
      });

      if (error) throw error;
      setPaymentMethod(data.payment_method);
    } catch (error) {
      console.error('Error fetching payment method:', error);
    } finally {
      setIsLoadingPaymentMethod(false);
    }
  };

  const getPlanTierIndex = (tier: string) => {
    const tiers = ['basic', 'plus', 'pro'];
    return tiers.indexOf(tier);
  };

  const getButtonState = (planId: string) => {
    if (planId === currentPlan) {
      return { label: 'Nuværende', disabled: true, variant: 'secondary' as const };
    }
    
    const currentIndex = getPlanTierIndex(currentPlan);
    const targetIndex = getPlanTierIndex(planId);
    
    if (targetIndex > currentIndex) {
      return { label: 'Opgrader', disabled: false, variant: 'default' as const };
    } else {
      return { label: 'Nedgrader', disabled: false, variant: 'outline' as const };
    }
  };

  const handlePlanChange = async (planId: string) => {
    if (planId === currentPlan) return;
    
    setSelectedPlan(planId);
    setIsChangingPlan(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('manage-subscription', {
        body: { 
          action: 'change_plan',
          new_plan_tier: planId,
        },
      });

      if (error) throw error;
      
      if (data.success) {
        // Get the plan name for the success toast
        const newPlanName = plans.find(p => p.id === planId)?.name || planId;
        toast.success(`Dit abonnement er succesfuldt ændret til ${newPlanName}.`);
        
        // Immediately update local state to reflect the change
        if (subscription) {
          setSubscription({
            ...subscription,
            plan_tier: planId as 'basic' | 'plus' | 'pro',
          });
        }
        
        // Force refetch global auth context to update subscription across all pages
        await refetchSubscription();
      } else if (data.error === 'not_stripe_linked') {
        toast.error(data.message || 'Dit abonnement er ikke forbundet til Stripe. Kontakt support.');
      } else {
        throw new Error(data.message || data.error || 'Unknown error');
      }
    } catch (error) {
      console.error('Error changing plan:', error);
      toast.error('Kunne ikke ændre abonnement. Prøv igen.');
    } finally {
      setIsChangingPlan(false);
      setSelectedPlan(null);
    }
  };

  const handleCancelSubscription = async () => {
    // Pre-check: abort if no stripe_subscription_id
    if (!subscription?.stripe_subscription_id) {
      toast.error('Dit abonnement er ikke forbundet til Stripe. Kontakt support for at opsige.');
      setShowCancelDialog(false);
      return;
    }

    setIsCancelling(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('manage-subscription', {
        body: { action: 'cancel_subscription' },
      });

      if (error) throw error;
      
      if (data.success) {
        toast.success('Dit abonnement er opsagt. Du har adgang til udgangen af perioden.');
        // Immediately update local state to reflect the cancellation
        if (subscription) {
          setSubscription({
            ...subscription,
            cancel_at_period_end: true,
          });
        }
        setShowCancelDialog(false);
      } else if (data.error === 'not_stripe_linked') {
        toast.error(data.message || 'Dit abonnement er ikke forbundet til Stripe. Kontakt support.');
        setShowCancelDialog(false);
      } else {
        throw new Error(data.message || data.error || 'Unknown error');
      }
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      toast.error('Kunne ikke opsige abonnement. Prøv igen.');
    } finally {
      setIsCancelling(false);
    }
  };

  const handleReactivateSubscription = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('manage-subscription', {
        body: { action: 'reactivate_subscription' },
      });

      if (error) throw error;
      
      if (data.success) {
        toast.success('Abonnement genaktiveret!');
        // Immediately update local state to reflect reactivation
        if (subscription) {
          setSubscription({
            ...subscription,
            cancel_at_period_end: false,
          });
        }
      } else if (data.error === 'not_stripe_linked') {
        toast.error(data.message || 'Dit abonnement er ikke forbundet til Stripe. Kontakt support.');
      } else {
        throw new Error(data.message || data.error || 'Unknown error');
      }
    } catch (error) {
      console.error('Error reactivating subscription:', error);
      toast.error('Kunne ikke genaktivere abonnement. Prøv igen.');
    }
  };

  const handleLinkToStripe = async () => {
    setIsLinkingStripe(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { planTier: currentPlan },
      });

      if (error) throw error;
      
      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error('Ingen checkout URL modtaget');
      }
    } catch (error) {
      console.error('Error linking to Stripe:', error);
      toast.error('Kunne ikke starte betalingsopsætning. Prøv igen.');
    } finally {
      setIsLinkingStripe(false);
    }
  };

  const handleUpdatePaymentMethod = async () => {
    setIsUpdatingPayment(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal', {});

      if (error) throw error;
      
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No portal URL returned');
      }
    } catch (error) {
      console.error('Error opening portal:', error);
      toast.error('Kunne ikke åbne betalingsportal. Prøv igen.');
    } finally {
      setIsUpdatingPayment(false);
    }
  };

  const formatDanishDate = (dateString: string) => {
    return format(new Date(dateString), 'd. MMM yyyy', { locale: da });
  };

  const formatAmount = (amount: number, currency: string) => {
    // Amount is in øre/cents
    const formatted = (amount / 100).toFixed(2).replace('.', ',');
    return `${formatted} ${currency.toUpperCase() === 'DKK' ? 'kr.' : currency.toUpperCase()}`;
  };

  const getCardBrandIcon = (brand: string) => {
    const brandLower = brand.toLowerCase();
    if (brandLower === 'visa') return '💳 Visa';
    if (brandLower === 'mastercard') return '💳 Mastercard';
    if (brandLower === 'amex') return '💳 Amex';
    return `💳 ${brand}`;
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="container flex h-18 items-center">
          <BackButton />
        </div>
      </header>

      <main className="container py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold mb-2">Dit Abonnement</h1>
          <p className="text-muted-foreground mb-8">
            Administrer din pakke, betalingsmetode og se fakturaer
          </p>

          {/* Current Plan Status */}
          <div className="card-elevated p-6 mb-8">
            <div className="flex items-center gap-3 mb-2">
              <CreditCard className="h-5 w-5 text-primary" />
              <h2 className="font-semibold">Nuværende pakke</h2>
              {isLegacySubscription && (
                <Badge variant="secondary" className="ml-2">Manuelt oprettet</Badge>
              )}
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">
                  {plans.find(p => p.id === currentPlan)?.name || 'Basic'}
                </p>
                <p className="text-muted-foreground">
                  {cancelAtPeriodEnd 
                    ? `Opsagt - stopper ${subscription?.current_period_end ? formatDanishDate(subscription.current_period_end) : ''}`
                    : subscription?.status === 'trialing' 
                      ? 'Prøveperiode' 
                      : subscription?.status === 'active' 
                        ? 'Aktivt abonnement' 
                        : 'Inaktivt'
                  }
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-primary">
                  {plans.find(p => p.id === currentPlan)?.price || 39} kr.
                </p>
                <p className="text-muted-foreground text-sm">pr. måned</p>
              </div>
            </div>
            
            {cancelAtPeriodEnd && (
              <div className="mt-4 p-3 bg-warning/10 rounded-lg border border-warning/20">
                <p className="text-sm text-warning-foreground mb-2">
                  Dit abonnement udløber ved periodens slutning.
                </p>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleReactivateSubscription}
                >
                  Genaktiver abonnement
                </Button>
              </div>
            )}

            {/* Legacy subscription notice */}
            {isLegacySubscription && (
              <div className="mt-4 p-4 bg-muted rounded-lg border">
                <p className="text-sm text-muted-foreground mb-3">
                  Dit abonnement blev oprettet manuelt og er ikke tilknyttet automatisk betaling.
                </p>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button
                    variant="default"
                    onClick={handleLinkToStripe}
                    disabled={isLinkingStripe}
                    className="flex-1"
                  >
                    {isLinkingStripe ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Vent venligst...
                      </>
                    ) : (
                      <>
                        <CreditCard className="mr-2 h-4 w-4" />
                        Opret automatisk betaling
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    asChild
                    className="flex-1"
                  >
                    <a href="mailto:support@mittek.dk?subject=Abonnement%20ændring">
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Kontakt support
                    </a>
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Payment Method - Only show if not legacy */}
          {!isLegacySubscription && (
            <div className="card-elevated p-6 mb-8">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <CreditCard className="h-5 w-5 text-primary" />
                  <h2 className="font-semibold">Betalingskort</h2>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleUpdatePaymentMethod}
                  disabled={isUpdatingPayment}
                >
                  {isUpdatingPayment ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  Opdater kort
                </Button>
              </div>
              
              {isLoadingPaymentMethod ? (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Henter kortoplysninger...</span>
                </div>
              ) : paymentMethod ? (
                <div className="flex items-center gap-4">
                  <span className="text-lg">{getCardBrandIcon(paymentMethod.brand)}</span>
                  <span className="font-mono">•••• {paymentMethod.last4}</span>
                  <span className="text-muted-foreground text-sm">
                    Udløber {paymentMethod.exp_month}/{paymentMethod.exp_year}
                  </span>
                </div>
              ) : (
                <p className="text-muted-foreground">Intet kort tilknyttet</p>
              )}
            </div>
          )}

          {/* Plan Selection */}
          <h2 className="font-semibold text-lg mb-4">Vælg Pakke</h2>
          <div className="grid gap-4 md:grid-cols-3 mb-12">
            {plans.map((plan) => {
              const buttonState = getButtonState(plan.id);
              const isLoading = isChangingPlan && selectedPlan === plan.id;
              
              return (
                <div
                  key={plan.id}
                  className={`card-elevated p-6 relative ${
                    plan.id === currentPlan 
                      ? 'ring-2 ring-primary' 
                      : plan.popular 
                        ? 'ring-1 ring-primary/30' 
                        : ''
                  }`}
                >
                  {plan.popular && plan.id !== currentPlan && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-primary text-primary-foreground text-xs font-medium rounded-full">
                      Populær
                    </div>
                  )}
                  
                  {plan.id === currentPlan && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-success text-success-foreground text-xs font-medium rounded-full">
                      Din pakke
                    </div>
                  )}

                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                      {plan.icon}
                    </div>
                    <h3 className="font-bold text-lg">{plan.name}</h3>
                  </div>

                  <div className="mb-4">
                    <span className="text-3xl font-bold">{plan.price}</span>
                    <span className="text-muted-foreground"> kr./md</span>
                  </div>

                  <ul className="space-y-2 mb-6">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 text-success flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    variant={buttonState.variant}
                    className="w-full"
                    disabled={buttonState.disabled || isLoading || cancelAtPeriodEnd || isLegacySubscription}
                    onClick={() => handlePlanChange(plan.id)}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Skifter...
                      </>
                    ) : isLegacySubscription && plan.id !== currentPlan ? (
                      'Kontakt support'
                    ) : (
                      <>
                        {buttonState.label}
                        {!buttonState.disabled && (
                          <ChevronRight className="ml-2 h-4 w-4" />
                        )}
                      </>
                    )}
                  </Button>
                </div>
              );
            })}
          </div>

          {/* Billing FAQ Section */}
          <div className="card-elevated p-6 mb-8">
            <div className="flex items-center gap-3 mb-4">
              <HelpCircle className="h-5 w-5 text-primary" />
              <h2 className="font-semibold">Ofte stillede spørgsmål</h2>
            </div>
            
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="change-plan">
                <AccordionTrigger className="text-left">
                  Hvordan ændrer jeg mit abonnement?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Du kan til enhver tid opgradere eller nedgradere din plan direkte her på siden. 
                  Ændringen træder i kraft med det samme.
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="invoices">
                <AccordionTrigger className="text-left">
                  Hvor finder jeg mine fakturaer?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Dine fakturaer sendes til din e-mail ved hver fornyelse.
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="binding">
                <AccordionTrigger className="text-left">
                  Er der bindingsperiode?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Nej, du kan opsige dit abonnement når som helst, så det stopper ved udgangen af den nuværende periode.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>

          {/* Billing History */}
          <div className="card-elevated p-6 mb-8">
            <div className="flex items-center gap-3 mb-4">
              <Receipt className="h-5 w-5 text-primary" />
              <h2 className="font-semibold">Faktura-historik</h2>
            </div>
            
            {isLoadingInvoices ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Henter fakturaer...</span>
              </div>
            ) : invoices.length === 0 ? (
              <p className="text-muted-foreground">Ingen fakturaer endnu</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-sm text-muted-foreground border-b border-border">
                      <th className="pb-2">Dato</th>
                      <th className="pb-2">Beløb</th>
                      <th className="pb-2">Status</th>
                      <th className="pb-2 text-right">Hent</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map((invoice) => (
                      <tr key={invoice.id} className="border-b border-border/50">
                        <td className="py-3">{formatDanishDate(invoice.date)}</td>
                        <td className="py-3">{formatAmount(invoice.amount, invoice.currency)}</td>
                        <td className="py-3">
                          <Badge variant={invoice.status === 'paid' ? 'default' : 'destructive'}>
                            {invoice.status === 'paid' ? 'Betalt' : 
                             invoice.status === 'open' ? 'Åben' : 
                             invoice.status === 'draft' ? 'Kladde' : 'Fejlet'}
                          </Badge>
                        </td>
                        <td className="py-3 text-right">
                          {invoice.pdf_url && (
                            <a 
                              href={invoice.pdf_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-primary hover:underline"
                            >
                              <Download className="h-4 w-4" />
                              PDF
                            </a>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Subscription Status & Danger Zone */}
          {subscription && currentPlan !== 'basic' && (
            <div className="border-t border-border pt-8">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="font-semibold text-lg mb-1">
                    Abonnementsstatus
                  </h2>
                  <p className="text-muted-foreground text-sm">
                    {cancelAtPeriodEnd 
                      ? 'Dit abonnement stopper ved periodens udløb.' 
                      : 'Dit abonnement fornyes automatisk.'}
                  </p>
                </div>
                <Badge 
                  variant={cancelAtPeriodEnd ? 'destructive' : 'default'}
                  className="text-sm px-3 py-1"
                >
                  {cancelAtPeriodEnd ? 'Afmeldt' : subscription.status === 'trialing' ? 'Prøveperiode' : 'Aktiv'}
                </Badge>
              </div>

              {!cancelAtPeriodEnd && (
                <Button
                  variant="ghost"
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={() => setShowCancelDialog(true)}
                >
                  Afmeld abonnement
                </Button>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Cancel Confirmation Dialog */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Er du sikker?</AlertDialogTitle>
            <AlertDialogDescription>
              Du mister adgangen til dine værktøjer og din hjælper. 
              Dit abonnement vil blive opsagt ved udgangen af den nuværende periode.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isCancelling}>
              Behold abonnement
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelSubscription}
              disabled={isCancelling}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isCancelling ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Afmelder...
                </>
              ) : (
                'Afmeld'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default SubscriptionManagement;
