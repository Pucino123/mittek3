import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, CreditCard, BookOpen, Loader2, Plus, Edit, Trash2, Search, RefreshCw, MessageSquare, Send, Gift, ChevronLeft, Upload, Image as ImageIcon, X, Eye, FileText, Shield, TrendingUp, Clock, AlertTriangle, DollarSign } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { da } from 'date-fns/locale';
import { BackButton } from '@/components/layout/BackButton';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { SortableGuideStep } from '@/components/admin/SortableGuideStep';
import { SortableGuideRow } from '@/components/admin/SortableGuideRow';
import { VisualHelpManager } from '@/components/admin/VisualHelpManager';
import { SystemContentEditor } from '@/components/admin/SystemContentEditor';
import { AuditLogViewer } from '@/components/admin/AuditLogViewer';
import { CreateUserDialog } from '@/components/admin/CreateUserDialog';
import { UserActionsMenu } from '@/components/admin/UserActionsMenu';


interface Subscription {
  id: string;
  user_id: string;
  plan_tier: string;
  status: string;
  current_period_end: string | null;
  trial_end: string | null;
}

interface Profile {
  id: string;
  user_id: string;
  email: string | null;
  display_name: string | null;
  is_admin: boolean;
  created_at: string;
  subscriptions?: Subscription | null;
}

interface PendingSubscription {
  id: string;
  checkout_session_id: string;
  purchaser_email: string;
  plan_tier: string;
  claimed: boolean;
  created_at: string;
}

interface Guide {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  icon: string | null;
  is_published: boolean;
  min_plan: string;
  sort_order: number;
}

const GUIDE_CATEGORIES = [
  { value: 'hverdag', label: 'Hverdag' },
  { value: 'sikkerhed', label: 'Sikkerhed' },
  { value: 'batteri', label: 'Batteri' },
  { value: 'icloud', label: 'iCloud' },
  { value: 'beskeder', label: 'Beskeder' },
  { value: 'apps', label: 'Apps' },
];

const GUIDE_ICONS = [
  { value: 'smartphone', label: 'Smartphone' },
  { value: 'shield', label: 'Sikkerhed' },
  { value: 'battery', label: 'Batteri' },
  { value: 'cloud', label: 'Cloud' },
  { value: 'message-circle', label: 'Beskeder' },
  { value: 'grid-3x3', label: 'Apps' },
  { value: 'settings', label: 'Indstillinger' },
  { value: 'refresh-cw', label: 'Opdatering' },
  { value: 'eye', label: 'Visning' },
  { value: 'lock', label: 'Lås' },
  { value: 'bell', label: 'Notifikationer' },
  { value: 'wifi', label: 'Wifi' },
  { value: 'volume-2', label: 'Lyd' },
  { value: 'camera', label: 'Kamera' },
  { value: 'image', label: 'Billede' },
];

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

interface Ticket {
  id: string;
  subject: string;
  category: string;
  status: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

interface Message {
  id: string;
  message: string;
  is_admin_reply: boolean;
  created_at: string;
  sender_id: string;
}

const Admin = () => {
  const { profile, isAdmin } = useAuth();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [pendingSubscriptions, setPendingSubscriptions] = useState<PendingSubscription[]>([]);
  const [guides, setGuides] = useState<Guide[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Guide editor state
  const [editingGuide, setEditingGuide] = useState<Guide | null>(null);
  const [guideTitle, setGuideTitle] = useState('');
  const [guideDescription, setGuideDescription] = useState('');
  const [guideCategory, setGuideCategory] = useState('');
  const [guideIcon, setGuideIcon] = useState('');
  const [isGuideDialogOpen, setIsGuideDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Guide steps editor state
  const [editingGuideSteps, setEditingGuideSteps] = useState<Guide | null>(null);
  const [guideSteps, setGuideSteps] = useState<GuideStep[]>([]);
  const [isStepsDialogOpen, setIsStepsDialogOpen] = useState(false);
  const [isLoadingSteps, setIsLoadingSteps] = useState(false);
  const [uploadingStepId, setUploadingStepId] = useState<string | null>(null);
  const [uploadingVideoStepId, setUploadingVideoStepId] = useState<string | null>(null);
  const [uploadingGifStepId, setUploadingGifStepId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Support state
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [ticketMessages, setTicketMessages] = useState<Message[]>([]);
  const [adminReply, setAdminReply] = useState('');
  const [isSendingReply, setIsSendingReply] = useState(false);

  // Grant plan state
  const [grantPlanDialogOpen, setGrantPlanDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<'basic' | 'plus' | 'pro'>('plus');
  
  const [isGranting, setIsGranting] = useState(false);
  const [isSyncingStripe, setIsSyncingStripe] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch profiles and subscriptions separately (no FK relationship exists)
      const [profilesRes, subscriptionsRes, pendingRes, guidesRes, ticketsRes] = await Promise.all([
        supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false })
          .range(0, 999),
        supabase.from('subscriptions').select('*').order('created_at', { ascending: false }).range(0, 999),
        supabase.from('pending_subscriptions').select('*').order('created_at', { ascending: false }).range(0, 999),
        supabase.from('guides').select('*').order('sort_order', { ascending: true }).range(0, 999),
        supabase.from('support_tickets').select('*').order('updated_at', { ascending: false }).range(0, 999),
      ]);

      // Log any errors for debugging
      if (profilesRes.error) {
        console.error('Profiles fetch error:', profilesRes.error);
        toast.error(`Profiler: ${profilesRes.error.message}`);
      }
      if (subscriptionsRes.error) {
        console.error('Subscriptions fetch error:', subscriptionsRes.error);
        toast.error(`Abonnementer: ${subscriptionsRes.error.message}`);
      }

      console.log('Fetched profiles:', profilesRes.data?.length, 'Subscriptions:', subscriptionsRes.data?.length);

      // Store subscriptions first so we can use them in the merge
      const allSubscriptions = subscriptionsRes.data || [];
      setSubscriptions(allSubscriptions);

      if (profilesRes.data) {
        // Merge profiles with their subscriptions manually (LEFT JOIN simulation)
        const transformedProfiles = profilesRes.data.map((p: any) => {
          // Find all subscriptions for this user
          const userSubs = allSubscriptions.filter(s => s.user_id === p.user_id);
          // Get the best subscription (prioritize active > trialing > others)
          const bestSub = userSubs.length 
            ? userSubs.sort((a, b) => {
                const priority: Record<string, number> = { active: 3, trialing: 2, past_due: 1, canceled: 0, incomplete: -1 };
                return (priority[b.status] ?? -1) - (priority[a.status] ?? -1);
              })[0]
            : null;
          return { ...p, subscriptions: bestSub };
        });
        setProfiles(transformedProfiles);
      }
      
      if (pendingRes.data) setPendingSubscriptions(pendingRes.data);
      if (guidesRes.data) setGuides(guidesRes.data);
      if (ticketsRes.data) setTickets(ticketsRes.data);
    } catch (error) {
      console.error('Fetch error:', error);
      toast.error('Kunne ikke hente data');
    } finally {
      setIsLoading(false);
    }
  };

  // Get subscription from embedded data or fallback to separate list
  const getUserSubscription = (userProfile: Profile) => {
    // First check embedded subscription
    if (userProfile.subscriptions) return userProfile.subscriptions;
    // Fallback to subscriptions list
    return subscriptions.find(s => s.user_id === userProfile.user_id);
  };
  
  // Format subscription status for display
  const getStatusBadge = (sub: Subscription | null | undefined) => {
    if (!sub) {
      return { label: 'Ingen plan', variant: 'outline' as const, className: 'border-muted-foreground/50 text-muted-foreground' };
    }
    switch (sub.status) {
      case 'active':
        return { label: 'Aktiv', variant: 'default' as const, className: 'bg-success text-success-foreground' };
      case 'trialing':
        return { label: 'Prøveperiode', variant: 'default' as const, className: 'bg-info text-info-foreground' };
      case 'past_due':
        return { label: 'Manglende betaling', variant: 'destructive' as const, className: '' };
      case 'canceled':
        return { label: 'Opsagt', variant: 'secondary' as const, className: '' };
      case 'incomplete':
        return { label: 'Afventer', variant: 'outline' as const, className: 'border-warning text-warning' };
      default:
        return { label: sub.status, variant: 'outline' as const, className: '' };
    }
  };
  
  // Format next billing date
  const getNextBillingText = (sub: Subscription | null | undefined) => {
    if (!sub || !sub.current_period_end) return '-';
    
    const date = new Date(sub.current_period_end);
    const formattedDate = format(date, 'd. MMM yyyy', { locale: da });
    
    if (sub.status === 'active') {
      return `Trækkes d. ${formattedDate}`;
    } else if (sub.status === 'trialing') {
      return `Starter d. ${formattedDate}`;
    } else if (sub.status === 'canceled') {
      return `Udløber d. ${formattedDate}`;
    }
    return formattedDate;
  };

  const getUserEmail = (userId: string) => {
    const p = profiles.find(pr => pr.user_id === userId);
    return p?.email || p?.display_name || 'Ukendt';
  };

  // Grant plan functionality
  const openGrantPlanDialog = (userProfile: Profile) => {
    setSelectedUser(userProfile);
    setSelectedPlan('plus');
    setGrantPlanDialogOpen(true);
  };

  const grantPlan = async () => {
    if (!selectedUser) return;
    setIsGranting(true);
    
    try {
      // Use the edge function for consistent plan management
      const response = await supabase.functions.invoke('admin-manage-user', {
        body: { 
          action: 'update_plan', 
          userId: selectedUser.user_id,
          planTier: selectedPlan
        }
      });

      if (response.error) throw new Error(response.error.message);
      if (response.data?.error) throw new Error(response.data.error);
      
      toast.success(`${selectedPlan.toUpperCase()} plan givet til ${selectedUser.email}`);
      setGrantPlanDialogOpen(false);
      fetchData();
    } catch (error) {
      console.error('Grant error:', error);
      toast.error(`Kunne ikke give plan: ${error instanceof Error ? error.message : 'Ukendt fejl'}`);
    } finally {
      setIsGranting(false);
    }
  };

  // Sync from Stripe function
  const syncFromStripe = async () => {
    setIsSyncingStripe(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Ikke logget ind');
        return;
      }

      const response = await supabase.functions.invoke('sync-stripe-customers', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      const result = response.data;
      
      if (result.success) {
        toast.success(
          `Stripe synkronisering fuldført!\n` +
          `Fundet: ${result.total_stripe_customers} kunder\n` +
          `Oprettet: ${result.created} nye brugere\n` +
          `Opdateret: ${result.updated} profiler\n` +
          `Sprunget over: ${result.skipped}`,
          { duration: 5000 }
        );
        
        if (result.errors?.length > 0) {
          console.error('Sync errors:', result.errors);
          toast.warning(`${result.errors.length} fejl under synkronisering - se konsol`);
        }
        
        // Refresh data
        fetchData();
      } else {
        throw new Error(result.error || 'Ukendt fejl');
      }
    } catch (error) {
      console.error('Stripe sync error:', error);
      toast.error(`Kunne ikke synkronisere fra Stripe: ${error instanceof Error ? error.message : 'Ukendt fejl'}`);
    } finally {
      setIsSyncingStripe(false);
    }
  };
  // Guide functions
  const openGuideEditor = (guide?: Guide) => {
    if (guide) {
      setEditingGuide(guide);
      setGuideTitle(guide.title);
      setGuideDescription(guide.description || '');
      setGuideCategory(guide.category || '');
      setGuideIcon(guide.icon || '');
    } else {
      setEditingGuide(null);
      setGuideTitle('');
      setGuideDescription('');
      setGuideCategory('');
      setGuideIcon('');
    }
    setIsGuideDialogOpen(true);
  };

  const saveGuide = async () => {
    if (!guideTitle.trim()) {
      toast.error('Titel er påkrævet');
      return;
    }

    setIsSaving(true);
    try {
      if (editingGuide) {
        const { error } = await supabase
          .from('guides')
          .update({
            title: guideTitle,
            description: guideDescription,
            category: guideCategory || null,
            icon: guideIcon || null,
          })
          .eq('id', editingGuide.id);

        if (error) throw error;
        toast.success('Guide opdateret');
      } else {
        const { error } = await supabase
          .from('guides')
          .insert({
            title: guideTitle,
            description: guideDescription,
            category: guideCategory || null,
            icon: guideIcon || null,
            is_published: false,
            min_plan: 'basic',
            sort_order: guides.length,
          });

        if (error) throw error;
        toast.success('Guide oprettet');
      }

      setIsGuideDialogOpen(false);
      fetchData();
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Kunne ikke gemme guide');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleGuidePublished = async (guide: Guide) => {
    try {
      const { error } = await supabase
        .from('guides')
        .update({ is_published: !guide.is_published })
        .eq('id', guide.id);

      if (error) throw error;
      fetchData();
    } catch (error) {
      console.error('Toggle error:', error);
      toast.error('Kunne ikke opdatere guide');
    }
  };

  const deleteGuide = async (guideId: string) => {
    if (!confirm('Er du sikker på at du vil slette denne guide?')) return;

    try {
      const { error } = await supabase
        .from('guides')
        .delete()
        .eq('id', guideId);

      if (error) throw error;
      toast.success('Guide slettet');
      fetchData();
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Kunne ikke slette guide');
    }
  };

  // Guide steps functions
  const openStepsEditor = async (guide: Guide) => {
    setEditingGuideSteps(guide);
    setIsStepsDialogOpen(true);
    setIsLoadingSteps(true);
    
    try {
      const { data, error } = await supabase
        .from('guide_steps')
        .select('*')
        .eq('guide_id', guide.id)
        .order('step_number', { ascending: true });
      
      if (error) throw error;
      setGuideSteps(data || []);
    } catch (error) {
      console.error('Steps fetch error:', error);
      toast.error('Kunne ikke hente trin');
    } finally {
      setIsLoadingSteps(false);
    }
  };

  const addStep = async () => {
    if (!editingGuideSteps) return;
    
    try {
      const newStepNumber = guideSteps.length + 1;
      const { data, error } = await supabase
        .from('guide_steps')
        .insert({
          guide_id: editingGuideSteps.id,
          step_number: newStepNumber,
          title: `Trin ${newStepNumber}`,
          instruction: '',
        })
        .select()
        .single();

      if (error) throw error;
      if (data) {
        setGuideSteps([...guideSteps, data]);
        toast.success('Trin tilføjet');
      }
    } catch (error) {
      console.error('Add step error:', error);
      toast.error('Kunne ikke tilføje trin');
    }
  };

  const updateStep = async (stepId: string, field: 'title' | 'instruction' | 'video_url', value: string) => {
    setGuideSteps(steps => 
      steps.map(s => s.id === stepId ? { ...s, [field]: value } : s)
    );
  };

  const saveStep = async (step: GuideStep) => {
    try {
      const { error } = await supabase
        .from('guide_steps')
        .update({
          title: step.title,
          instruction: step.instruction,
          video_url: step.video_url || null,
        })
        .eq('id', step.id);

      if (error) throw error;
      toast.success('Trin gemt');
    } catch (error) {
      console.error('Save step error:', error);
      toast.error('Kunne ikke gemme trin');
    }
  };

  const uploadStepVideo = async (stepId: string, file: File) => {
    setUploadingVideoStepId(stepId);
    
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `guide-step-video-${stepId}-${Date.now()}.${fileExt}`;
      const filePath = `videos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('guide-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('guide-images')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('guide_steps')
        .update({ video_url: publicUrl })
        .eq('id', stepId);

      if (updateError) throw updateError;

      setGuideSteps(steps => 
        steps.map(s => s.id === stepId ? { ...s, video_url: publicUrl } : s)
      );

      toast.success('Video uploadet');
    } catch (error) {
      console.error('Video upload error:', error);
      toast.error('Kunne ikke uploade video');
    } finally {
      setUploadingVideoStepId(null);
    }
  };

  const removeStepVideo = async (stepId: string) => {
    try {
      const { error } = await supabase
        .from('guide_steps')
        .update({ video_url: null })
        .eq('id', stepId);

      if (error) throw error;

      setGuideSteps(steps => 
        steps.map(s => s.id === stepId ? { ...s, video_url: null } : s)
      );

      toast.success('Video fjernet');
    } catch (error) {
      console.error('Remove video error:', error);
      toast.error('Kunne ikke fjerne video');
    }
  };

  const uploadStepGif = async (stepId: string, file: File) => {
    setUploadingGifStepId(stepId);
    
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `guide-step-gif-${stepId}-${Date.now()}.${fileExt}`;
      const filePath = `gifs/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('guide-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('guide-images')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('guide_steps')
        .update({ animated_gif_url: publicUrl })
        .eq('id', stepId);

      if (updateError) throw updateError;

      setGuideSteps(steps => 
        steps.map(s => s.id === stepId ? { ...s, animated_gif_url: publicUrl } : s)
      );

      toast.success('GIF uploadet');
    } catch (error) {
      console.error('GIF upload error:', error);
      toast.error('Kunne ikke uploade GIF');
    } finally {
      setUploadingGifStepId(null);
    }
  };

  const removeStepGif = async (stepId: string) => {
    try {
      const { error } = await supabase
        .from('guide_steps')
        .update({ animated_gif_url: null })
        .eq('id', stepId);

      if (error) throw error;

      setGuideSteps(steps => 
        steps.map(s => s.id === stepId ? { ...s, animated_gif_url: null } : s)
      );

      toast.success('GIF fjernet');
    } catch (error) {
      console.error('Remove GIF error:', error);
      toast.error('Kunne ikke fjerne GIF');
    }
  };

  const deleteStep = async (stepId: string) => {
    if (!confirm('Er du sikker på at du vil slette dette trin?')) return;

    try {
      const { error } = await supabase
        .from('guide_steps')
        .delete()
        .eq('id', stepId);

      if (error) throw error;
      setGuideSteps(steps => steps.filter(s => s.id !== stepId));
      toast.success('Trin slettet');
    } catch (error) {
      console.error('Delete step error:', error);
      toast.error('Kunne ikke slette trin');
    }
  };

  // DnD sensors for drag-and-drop
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = guideSteps.findIndex((s) => s.id === active.id);
      const newIndex = guideSteps.findIndex((s) => s.id === over.id);

      const newSteps = arrayMove(guideSteps, oldIndex, newIndex);
      setGuideSteps(newSteps);

      // Update step_number in database for all reordered steps
      try {
        const updates = newSteps.map((step, index) => 
          supabase
            .from('guide_steps')
            .update({ step_number: index + 1 })
            .eq('id', step.id)
        );
        
        await Promise.all(updates);
        toast.success('Rækkefølge opdateret');
      } catch (error) {
        console.error('Reorder error:', error);
        toast.error('Kunne ikke opdatere rækkefølge');
      }
    }
  };

  // Handle drag end for guides reordering
  const handleGuideDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = guides.findIndex((g) => g.id === active.id);
      const newIndex = guides.findIndex((g) => g.id === over.id);

      const newGuides = arrayMove(guides, oldIndex, newIndex);
      setGuides(newGuides);

      // Update sort_order in database for all reordered guides
      try {
        const updates = newGuides.map((guide, index) => 
          supabase
            .from('guides')
            .update({ sort_order: index })
            .eq('id', guide.id)
        );
        
        await Promise.all(updates);
        toast.success('Guide-rækkefølge opdateret');
      } catch (error) {
        console.error('Guide reorder error:', error);
        toast.error('Kunne ikke opdatere rækkefølge');
      }
    }
  };

  const uploadStepImage = async (stepId: string, file: File) => {
    setUploadingStepId(stepId);
    
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `guide-step-${stepId}-${Date.now()}.${fileExt}`;
      const filePath = `images/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('guide-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('guide-images')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('guide_steps')
        .update({ image_url: publicUrl })
        .eq('id', stepId);

      if (updateError) throw updateError;

      setGuideSteps(steps => 
        steps.map(s => s.id === stepId ? { ...s, image_url: publicUrl } : s)
      );

      toast.success('Billede uploadet');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Kunne ikke uploade billede');
    } finally {
      setUploadingStepId(null);
    }
  };

  const handleFileSelect = (stepId: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Kun billeder er tilladt');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Fil er for stor (max 5MB)');
        return;
      }
      uploadStepImage(stepId, file);
    }
    event.target.value = '';
  };

  const removeStepImage = async (stepId: string) => {
    try {
      const { error } = await supabase
        .from('guide_steps')
        .update({ image_url: null })
        .eq('id', stepId);

      if (error) throw error;

      setGuideSteps(steps => 
        steps.map(s => s.id === stepId ? { ...s, image_url: null } : s)
      );

      toast.success('Billede fjernet');
    } catch (error) {
      console.error('Remove image error:', error);
      toast.error('Kunne ikke fjerne billede');
    }
  };

  // Support functions
  const openTicket = async (ticket: Ticket) => {
    setSelectedTicket(ticket);
    
    const { data, error } = await supabase
      .from('support_messages')
      .select('*')
      .eq('ticket_id', ticket.id)
      .order('created_at', { ascending: true });
    
    if (data) {
      setTicketMessages(data);
    }
  };

  const sendAdminReply = async () => {
    if (!selectedTicket || !adminReply.trim() || !profile) return;
    
    setIsSendingReply(true);
    try {
      const { error } = await supabase
        .from('support_messages')
        .insert({
          ticket_id: selectedTicket.id,
          sender_id: profile.user_id,
          message: adminReply.trim(),
          is_admin_reply: true,
        });

      if (error) throw error;

      await supabase
        .from('support_tickets')
        .update({ 
          updated_at: new Date().toISOString(),
          status: 'in_progress'
        })
        .eq('id', selectedTicket.id);

      toast.success('Svar sendt');
      setAdminReply('');
      openTicket(selectedTicket);
      fetchData();
    } catch (error) {
      console.error('Reply error:', error);
      toast.error('Kunne ikke sende svar');
    } finally {
      setIsSendingReply(false);
    }
  };

  const updateTicketStatus = async (ticketId: string, status: 'open' | 'in_progress' | 'resolved' | 'closed') => {
    try {
      const { error } = await supabase
        .from('support_tickets')
        .update({ status })
        .eq('id', ticketId);

      if (error) throw error;
      toast.success('Status opdateret');
      fetchData();
      if (selectedTicket?.id === ticketId) {
        setSelectedTicket({ ...selectedTicket, status });
      }
    } catch (error) {
      console.error('Status error:', error);
      toast.error('Kunne ikke opdatere status');
    }
  };

  const filteredProfiles = profiles.filter(p => 
    p.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.display_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate KPI metrics - exclude specific emails from revenue calculations
  const excludedEmails = ['kevin.therkildsen@icloud.com', 'kevin@ihero.dk', 'sabina-bini@hotmail.com'];
  const excludedUserIds = profiles
    .filter(p => p.email && excludedEmails.includes(p.email.toLowerCase()))
    .map(p => p.user_id);
  
  // Get MRR contributors for breakdown display
  const mrrContributors = subscriptions
    .filter(s => s.status === 'active')
    .map(s => {
      const profile = profiles.find(p => p.user_id === s.user_id);
      const email = profile?.email || 'Ukendt';
      const isExcluded = excludedUserIds.includes(s.user_id);
      const prices: Record<string, number> = { basic: 49, plus: 99, pro: 199 };
      const amount = prices[s.plan_tier] || 0;
      return { email, plan: s.plan_tier, amount, isExcluded, user_id: s.user_id };
    });
  
  const kpiMetrics = {
    totalUsers: profiles.length,
    payingUsers: subscriptions.filter(s => s.status === 'active' && !excludedUserIds.includes(s.user_id)).length,
    trialingUsers: subscriptions.filter(s => s.status === 'trialing' && !excludedUserIds.includes(s.user_id)).length,
    canceledUsers: subscriptions.filter(s => s.status === 'canceled').length,
    // MRR calculation: ONLY count 'active' subscriptions, exclude specific emails
    mrr: mrrContributors
      .filter(c => !c.isExcluded)
      .reduce((sum, c) => sum + c.amount, 0),
    // Churn rate: canceled / (active + canceled) last 30 days (simplified)
    churnRate: subscriptions.length > 0 
      ? Math.round((subscriptions.filter(s => s.status === 'canceled').length / subscriptions.length) * 100)
      : 0,
  };

  // State for MRR breakdown dialog
  const [showMrrBreakdown, setShowMrrBreakdown] = useState(false);

  // Admin check is now handled by AdminRoute in App.tsx
  // This component will only render for verified admins


  return (
    <div className="min-h-screen bg-background">
      {/* Header with Back Button */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
        <div className="container flex h-18 items-center justify-between">
          <BackButton />
          <Button variant="outline" onClick={fetchData} disabled={isLoading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Opdater
          </Button>
        </div>
      </header>

      <div className="container py-8 md:py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">Administrer brugere, support og indhold</p>
        </div>

        {/* KPI Overview Panel */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/20">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{kpiMetrics.totalUsers}</p>
                  <p className="text-xs text-muted-foreground">Total brugere</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-success/10 to-success/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-success/20">
                  <CreditCard className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{kpiMetrics.payingUsers}</p>
                  <p className="text-xs text-muted-foreground">Betalende</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-info/10 to-info/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-info/20">
                  <Clock className="h-5 w-5 text-info" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{kpiMetrics.trialingUsers}</p>
                  <p className="text-xs text-muted-foreground">Prøveperiode</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-warning/10 to-warning/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-warning/20">
                  <AlertTriangle className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{kpiMetrics.churnRate}%</p>
                  <p className="text-xs text-muted-foreground">Churn rate</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card 
            className="bg-gradient-to-br from-accent/10 to-accent/5 cursor-pointer hover:ring-2 ring-accent/50 transition-all"
            onClick={() => setShowMrrBreakdown(true)}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-accent/20">
                  <TrendingUp className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{kpiMetrics.mrr} kr</p>
                  <p className="text-xs text-muted-foreground">MRR (klik for detaljer)</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-destructive/10 to-destructive/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-destructive/20">
                  <X className="h-5 w-5 text-destructive" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{kpiMetrics.canceledUsers}</p>
                  <p className="text-xs text-muted-foreground">Opsagte</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* MRR Breakdown Dialog */}
        <Dialog open={showMrrBreakdown} onOpenChange={setShowMrrBreakdown}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                MRR Breakdown
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                <span className="font-medium">Total MRR</span>
                <span className="text-xl font-bold text-success">{kpiMetrics.mrr} kr</span>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium text-sm text-muted-foreground">Aktive abonnementer</h4>
                {mrrContributors.length === 0 ? (
                  <p className="text-sm text-muted-foreground italic">Ingen aktive abonnementer</p>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {mrrContributors.map((contributor, idx) => (
                      <div 
                        key={idx} 
                        className={`flex justify-between items-center p-3 rounded-lg border ${
                          contributor.isExcluded 
                            ? 'bg-muted/50 border-dashed opacity-60' 
                            : 'bg-card border-border'
                        }`}
                      >
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">{contributor.email}</span>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {contributor.plan.toUpperCase()}
                            </Badge>
                            {contributor.isExcluded && (
                              <Badge variant="secondary" className="text-xs">
                                Ekskluderet
                              </Badge>
                            )}
                          </div>
                        </div>
                        <span className={`font-medium ${contributor.isExcluded ? 'line-through text-muted-foreground' : 'text-success'}`}>
                          {contributor.amount} kr
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="pt-2 border-t text-xs text-muted-foreground">
                <p>• Kun "active" abonnementer tælles i MRR</p>
                <p>• Ekskluderede emails: {excludedEmails.join(', ')}</p>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="h-14 w-full justify-start overflow-x-auto">
            <TabsTrigger value="users" className="h-12 px-4 md:px-6">
              <Users className="mr-2 h-5 w-5" />
              <span className="hidden sm:inline">Brugere</span> ({profiles.length})
            </TabsTrigger>
            <TabsTrigger value="support" className="h-12 px-4 md:px-6">
              <MessageSquare className="mr-2 h-5 w-5" />
              <span className="hidden sm:inline">Support</span> ({tickets.filter(t => t.status === 'open').length})
            </TabsTrigger>
            <TabsTrigger value="content" className="h-12 px-4 md:px-6">
              <BookOpen className="mr-2 h-5 w-5" />
              <span className="hidden sm:inline">Guides</span> ({guides.length})
            </TabsTrigger>
            <TabsTrigger value="visual" className="h-12 px-4 md:px-6">
              <Eye className="mr-2 h-5 w-5" />
              <span className="hidden sm:inline">Visuel Hjælp</span>
            </TabsTrigger>
            <TabsTrigger value="pending" className="h-12 px-4 md:px-6">
              <CreditCard className="mr-2 h-5 w-5" />
              <span className="hidden sm:inline">Pending</span> ({pendingSubscriptions.filter(p => !p.claimed).length})
            </TabsTrigger>
            <TabsTrigger value="system" className="h-12 px-4 md:px-6">
              <FileText className="mr-2 h-5 w-5" />
              <span className="hidden sm:inline">System Tekster</span>
            </TabsTrigger>
            <TabsTrigger value="audit" className="h-12 px-4 md:px-6">
              <Shield className="mr-2 h-5 w-5" />
              <span className="hidden sm:inline">Audit Log</span>
            </TabsTrigger>
          </TabsList>

          {/* Users Tab */}
          <TabsContent value="users">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div>
                    <CardTitle>Brugere</CardTitle>
                    <CardDescription>Alle registrerede brugere</CardDescription>
                  </div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="relative w-64">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Søg efter email eller navn..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                    <Button 
                      variant="outline" 
                      onClick={syncFromStripe} 
                      disabled={isSyncingStripe}
                    >
                      {isSyncingStripe ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <RefreshCw className="mr-2 h-4 w-4" />
                      )}
                      Synk fra Stripe
                    </Button>
                    <CreateUserDialog onUserCreated={fetchData} />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Bruger</TableHead>
                        <TableHead>Plan</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Næste Trækning</TableHead>
                        <TableHead className="text-right">Handling</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredProfiles.map((userProfile) => {
                        const sub = getUserSubscription(userProfile);
                        const statusBadge = getStatusBadge(sub);
                        const nextBilling = getNextBillingText(sub);
                        return (
                          <TableRow key={userProfile.id}>
                            <TableCell>
                              <div className="flex flex-col">
                                <span className="font-medium flex items-center gap-2">
                                  {userProfile.email || '-'}
                                  {userProfile.is_admin && (
                                    <Badge variant="secondary" className="text-xs">Admin</Badge>
                                  )}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {userProfile.display_name ? `${userProfile.display_name} • ` : ''}
                                  Oprettet {format(new Date(userProfile.created_at), 'd. MMM yyyy', { locale: da })}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant={sub ? 'default' : 'outline'} className={sub ? 'bg-primary' : ''}>
                                {sub?.plan_tier?.toUpperCase() || 'Ingen'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant={statusBadge.variant} className={statusBadge.className}>
                                {statusBadge.label}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {nextBilling}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openGrantPlanDialog(userProfile)}
                                >
                                  <Gift className="mr-2 h-4 w-4" />
                                  Giv Plan
                                </Button>
                                <UserActionsMenu
                                  userId={userProfile.user_id}
                                  userEmail={userProfile.email || ''}
                                  currentPlan={sub?.plan_tier || null}
                                  isActive={sub?.status === 'active' || sub?.status === 'trialing'}
                                  onActionComplete={fetchData}
                                />
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            {/* Grant Plan Dialog */}
            <Dialog open={grantPlanDialogOpen} onOpenChange={setGrantPlanDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Giv Gratis Adgang</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <p className="text-sm text-muted-foreground">
                    Giv {selectedUser?.email} gratis adgang til en plan
                  </p>
                  <div className="space-y-2">
                    <Label>Vælg Plan</Label>
                    <Select value={selectedPlan} onValueChange={(v) => setSelectedPlan(v as 'basic' | 'plus' | 'pro')}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="basic">Basic</SelectItem>
                        <SelectItem value="plus">Plus</SelectItem>
                        <SelectItem value="pro">Pro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex gap-2 pt-4">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => setGrantPlanDialogOpen(false)}
                    >
                      Annuller
                    </Button>
                    <Button
                      className="flex-1"
                      onClick={grantPlan}
                      disabled={isGranting}
                    >
                      {isGranting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Gift className="mr-2 h-4 w-4" />
                          Giv Adgang
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </TabsContent>

          {/* Support Tab */}
          <TabsContent value="support">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Ticket List */}
              <Card>
                <CardHeader>
                  <CardTitle>Support Sager</CardTitle>
                  <CardDescription>Klik på en sag for at se og besvare</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  {isLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : tickets.length === 0 ? (
                    <p className="text-center py-8 text-muted-foreground">Ingen support sager</p>
                  ) : (
                    <div className="divide-y">
                      {tickets.map((ticket) => (
                        <button
                          key={ticket.id}
                          onClick={() => openTicket(ticket)}
                          className={`w-full text-left p-4 hover:bg-muted transition-colors ${
                            selectedTicket?.id === ticket.id ? 'bg-muted' : ''
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="font-medium truncate">{ticket.subject}</p>
                              <p className="text-sm text-muted-foreground">
                                {getUserEmail(ticket.user_id)}
                              </p>
                            </div>
                            <Badge variant={
                              ticket.status === 'open' ? 'default' :
                              ticket.status === 'in_progress' ? 'secondary' :
                              'outline'
                            }>
                              {ticket.status === 'open' ? 'Åben' :
                               ticket.status === 'in_progress' ? 'I gang' :
                               ticket.status === 'resolved' ? 'Løst' :
                               ticket.status}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {format(new Date(ticket.updated_at), "d. MMM 'kl.' HH:mm", { locale: da })}
                          </p>
                        </button>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Ticket Detail */}
              <Card>
                <CardHeader>
                  {selectedTicket ? (
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <CardTitle>{selectedTicket.subject}</CardTitle>
                        <CardDescription>
                          {getUserEmail(selectedTicket.user_id)} • {selectedTicket.category}
                        </CardDescription>
                      </div>
                      <Select
                        value={selectedTicket.status}
                        onValueChange={(status: string) => updateTicketStatus(selectedTicket.id, status as 'open' | 'in_progress' | 'resolved' | 'closed')}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="open">Åben</SelectItem>
                          <SelectItem value="in_progress">I gang</SelectItem>
                          <SelectItem value="resolved">Løst</SelectItem>
                          <SelectItem value="closed">Lukket</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  ) : (
                    <CardTitle className="text-muted-foreground">Vælg en sag</CardTitle>
                  )}
                </CardHeader>
                <CardContent>
                  {selectedTicket ? (
                    <div className="space-y-4">
                      {/* Messages */}
                      <div className="max-h-64 overflow-y-auto space-y-3 border rounded-lg p-4 bg-muted/30">
                        {ticketMessages.map((msg) => (
                          <div
                            key={msg.id}
                            className={`p-3 rounded-lg ${
                              msg.is_admin_reply
                                ? 'bg-primary/10 ml-4'
                                : 'bg-background mr-4'
                            }`}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-medium">
                                {msg.is_admin_reply ? 'Support' : 'Bruger'}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {format(new Date(msg.created_at), "d. MMM HH:mm", { locale: da })}
                              </span>
                            </div>
                            <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                          </div>
                        ))}
                        {ticketMessages.length === 0 && (
                          <p className="text-center text-muted-foreground py-4">
                            Ingen beskeder endnu
                          </p>
                        )}
                      </div>

                      {/* Reply */}
                      <div className="space-y-2">
                        <Textarea
                          value={adminReply}
                          onChange={(e) => setAdminReply(e.target.value)}
                          placeholder="Skriv dit svar..."
                          rows={3}
                        />
                        <Button
                          onClick={sendAdminReply}
                          disabled={isSendingReply || !adminReply.trim()}
                          className="w-full"
                        >
                          {isSendingReply ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <Send className="mr-2 h-4 w-4" />
                              Send Svar
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-12">
                      Vælg en sag fra listen for at se detaljerne
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Pending Subscriptions Tab */}
          <TabsContent value="pending">
            <Card>
              <CardHeader>
                <CardTitle>Pending Subscriptions</CardTitle>
                <CardDescription>Betalinger der endnu ikke er knyttet til en konto</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : pendingSubscriptions.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground">Ingen pending subscriptions</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Email</TableHead>
                        <TableHead>Plan</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Oprettet</TableHead>
                        <TableHead>Session ID</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingSubscriptions.map((pending) => (
                        <TableRow key={pending.id}>
                          <TableCell className="font-medium">{pending.purchaser_email}</TableCell>
                          <TableCell>
                            <Badge>{pending.plan_tier.toUpperCase()}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={pending.claimed ? 'secondary' : 'default'}>
                              {pending.claimed ? 'Claimed' : 'Unclaimed'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {new Date(pending.created_at).toLocaleDateString('da-DK')}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground font-mono">
                            {pending.checkout_session_id.slice(0, 20)}...
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Visual Help Tab */}
          <TabsContent value="visual">
            <VisualHelpManager />
          </TabsContent>

          {/* Content Tab */}
          <TabsContent value="content">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div>
                    <CardTitle>Guides</CardTitle>
                    <CardDescription>Administrer mini-guides og deres trin</CardDescription>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <Dialog open={isGuideDialogOpen} onOpenChange={setIsGuideDialogOpen}>
                      <DialogTrigger asChild>
                        <Button onClick={() => openGuideEditor()}>
                          <Plus className="mr-2 h-4 w-4" />
                          Ny guide
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>
                            {editingGuide ? 'Rediger guide' : 'Opret ny guide'}
                          </DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 pt-4">
                          <div className="space-y-2">
                            <Label htmlFor="title">Titel</Label>
                            <Input
                              id="title"
                              value={guideTitle}
                              onChange={(e) => setGuideTitle(e.target.value)}
                              placeholder="F.eks. Sådan tager du et screenshot"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="description">Beskrivelse</Label>
                            <Textarea
                              id="description"
                              value={guideDescription}
                              onChange={(e) => setGuideDescription(e.target.value)}
                              placeholder="Kort beskrivelse af guiden..."
                              rows={3}
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="category">Kategori</Label>
                              <Select value={guideCategory} onValueChange={setGuideCategory}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Vælg kategori" />
                                </SelectTrigger>
                                <SelectContent>
                                  {GUIDE_CATEGORIES.map((cat) => (
                                    <SelectItem key={cat.value} value={cat.value}>
                                      {cat.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="icon">Ikon</Label>
                              <Select value={guideIcon} onValueChange={setGuideIcon}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Vælg ikon" />
                                </SelectTrigger>
                                <SelectContent>
                                  {GUIDE_ICONS.map((icon) => (
                                    <SelectItem key={icon.value} value={icon.value}>
                                      {icon.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <div className="flex gap-2 pt-4">
                            <Button
                              variant="outline"
                              className="flex-1"
                              onClick={() => setIsGuideDialogOpen(false)}
                            >
                              Annuller
                            </Button>
                            <Button
                              className="flex-1"
                              onClick={saveGuide}
                              disabled={isSaving}
                            >
                              {isSaving ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                'Gem'
                              )}
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : guides.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground mb-4">Ingen guides endnu</p>
                    <Button onClick={() => openGuideEditor()}>
                      <Plus className="mr-2 h-4 w-4" />
                      Opret første guide
                    </Button>
                  </div>
                ) : (
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleGuideDragEnd}
                  >
                    <SortableContext
                      items={guides.map(g => g.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-10"></TableHead>
                            <TableHead>Titel</TableHead>
                            <TableHead>Kategori</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Handlinger</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {guides.map((guide) => (
                            <SortableGuideRow
                              key={guide.id}
                              guide={guide}
                              onEdit={openGuideEditor}
                              onDelete={deleteGuide}
                              onTogglePublished={toggleGuidePublished}
                              onOpenSteps={openStepsEditor}
                            />
                          ))}
                        </TableBody>
                      </Table>
                    </SortableContext>
                  </DndContext>
                )}
              </CardContent>
            </Card>

            {/* Guide Steps Dialog */}
            <Dialog open={isStepsDialogOpen} onOpenChange={setIsStepsDialogOpen}>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    Rediger Trin: {editingGuideSteps?.title}
                  </DialogTitle>
                </DialogHeader>
                
                {isLoadingSteps ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <div className="space-y-6 pt-4">
                    <p className="text-sm text-muted-foreground">
                      Træk i håndtaget for at ændre rækkefølgen
                    </p>
                    
                    <DndContext
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragEnd={handleDragEnd}
                    >
                      <SortableContext
                        items={guideSteps.map(s => s.id)}
                        strategy={verticalListSortingStrategy}
                      >
                        <div className="space-y-4">
                          {guideSteps.map((step, index) => (
                            <SortableGuideStep
                              key={step.id}
                              step={step}
                              index={index}
                              onUpdateStep={updateStep}
                              onSaveStep={saveStep}
                              onDeleteStep={deleteStep}
                              onFileSelect={handleFileSelect}
                              onRemoveImage={removeStepImage}
                              onVideoUpload={uploadStepVideo}
                              onRemoveVideo={removeStepVideo}
                              onGifUpload={uploadStepGif}
                              onRemoveGif={removeStepGif}
                              uploadingStepId={uploadingStepId}
                              uploadingVideoStepId={uploadingVideoStepId}
                              uploadingGifStepId={uploadingGifStepId}
                            />
                          ))}
                        </div>
                      </SortableContext>
                    </DndContext>

                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={addStep}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Tilføj Trin
                    </Button>
                  </div>
                )}
              </DialogContent>
            </Dialog>
          </TabsContent>

          {/* System Content Tab */}
          <TabsContent value="system">
            <SystemContentEditor />
          </TabsContent>

          {/* Audit Log Tab */}
          <TabsContent value="audit">
            <AuditLogViewer />
          </TabsContent>
        </Tabs>
      </div>

    </div>
  );
};

export default Admin;
