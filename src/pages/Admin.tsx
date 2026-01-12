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
import { Users, CreditCard, BookOpen, Loader2, Plus, Edit, Trash2, Search, RefreshCw, MessageSquare, Send, Gift, ChevronLeft, Upload, Image as ImageIcon, X, Eye, FileText } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { da } from 'date-fns/locale';
import { BackButton } from '@/components/layout/BackButton';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { SortableGuideStep } from '@/components/admin/SortableGuideStep';
import { VisualHelpManager } from '@/components/admin/VisualHelpManager';
import { SystemContentEditor } from '@/components/admin/SystemContentEditor';


interface Profile {
  id: string;
  user_id: string;
  email: string | null;
  display_name: string | null;
  is_admin: boolean;
  created_at: string;
}

interface Subscription {
  id: string;
  user_id: string;
  plan_tier: string;
  status: string;
  current_period_end: string | null;
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
  is_published: boolean;
  min_plan: string;
  sort_order: number;
}

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
  const { profile } = useAuth();
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

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [profilesRes, subscriptionsRes, pendingRes, guidesRes, ticketsRes] = await Promise.all([
        supabase.from('profiles').select('*').order('created_at', { ascending: false }).range(0, 999),
        supabase.from('subscriptions').select('*').order('created_at', { ascending: false }).range(0, 999),
        supabase.from('pending_subscriptions').select('*').order('created_at', { ascending: false }).range(0, 999),
        supabase.from('guides').select('*').order('sort_order', { ascending: true }).range(0, 999),
        supabase.from('support_tickets').select('*').order('updated_at', { ascending: false }).range(0, 999),
      ]);

      if (profilesRes.data) setProfiles(profilesRes.data);
      if (subscriptionsRes.data) setSubscriptions(subscriptionsRes.data);
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

  const getUserSubscription = (userId: string) => {
    return subscriptions.find(s => s.user_id === userId && s.status === 'active');
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
      const existingSub = subscriptions.find(s => s.user_id === selectedUser.user_id);
      
      if (existingSub) {
        const { error } = await supabase
          .from('subscriptions')
          .update({
            plan_tier: selectedPlan,
            status: 'active',
            current_period_end: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
          })
          .eq('id', existingSub.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('subscriptions')
          .upsert({
            user_id: selectedUser.user_id,
            plan_tier: selectedPlan,
            status: 'active' as const,
            current_period_start: new Date().toISOString(),
            current_period_end: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
          }, { onConflict: 'user_id' });
        
        if (error) throw error;
      }
      
      toast.success(`${selectedPlan.toUpperCase()} plan givet til ${selectedUser.email}`);
      setGrantPlanDialogOpen(false);
      fetchData();
    } catch (error) {
      console.error('Grant error:', error);
      toast.error('Kunne ikke give plan');
    } finally {
      setIsGranting(false);
    }
  };
  // Guide functions
  const openGuideEditor = (guide?: Guide) => {
    if (guide) {
      setEditingGuide(guide);
      setGuideTitle(guide.title);
      setGuideDescription(guide.description || '');
    } else {
      setEditingGuide(null);
      setGuideTitle('');
      setGuideDescription('');
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

  // Check if current user is admin
  if (!profile?.is_admin) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
          <div className="container flex h-18 items-center">
            <BackButton />
          </div>
        </header>
        <div className="container py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">Ingen adgang</h1>
          <p className="text-muted-foreground">Du har ikke adgang til denne side.</p>
        </div>
      </div>
    );
  }

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

        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="h-14 flex-wrap">
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
                  <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Søg efter email eller navn..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9"
                    />
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
                        <TableHead>Email</TableHead>
                        <TableHead>Navn</TableHead>
                        <TableHead>Plan</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Oprettet</TableHead>
                        <TableHead className="text-right">Handling</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredProfiles.map((userProfile) => {
                        const sub = getUserSubscription(userProfile.user_id);
                        return (
                          <TableRow key={userProfile.id}>
                            <TableCell className="font-medium">
                              {userProfile.email || '-'}
                              {userProfile.is_admin && (
                                <Badge variant="secondary" className="ml-2">Admin</Badge>
                              )}
                            </TableCell>
                            <TableCell>{userProfile.display_name || '-'}</TableCell>
                            <TableCell>
                              <Badge variant={sub ? 'default' : 'outline'}>
                                {sub?.plan_tier?.toUpperCase() || 'Ingen'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant={sub?.status === 'active' ? 'default' : 'secondary'}>
                                {sub?.status || 'Inaktiv'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {new Date(userProfile.created_at).toLocaleDateString('da-DK')}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openGrantPlanDialog(userProfile)}
                              >
                                <Gift className="mr-2 h-4 w-4" />
                                Giv Plan
                              </Button>
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
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Titel</TableHead>
                        <TableHead>Min. plan</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Handlinger</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {guides.map((guide) => (
                        <TableRow key={guide.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{guide.title}</p>
                              {guide.description && (
                                <p className="text-sm text-muted-foreground line-clamp-1">
                                  {guide.description}
                                </p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{guide.min_plan}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={guide.is_published ? 'default' : 'secondary'}
                              className="cursor-pointer"
                              onClick={() => toggleGuidePublished(guide)}
                            >
                              {guide.is_published ? 'Publiceret' : 'Kladde'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex gap-2 justify-end">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openStepsEditor(guide)}
                              >
                                <ImageIcon className="mr-2 h-4 w-4" />
                                Trin
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => openGuideEditor(guide)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => deleteGuide(guide.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
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
        </Tabs>
      </div>

    </div>
  );
};

export default Admin;
