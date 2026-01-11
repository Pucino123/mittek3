import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { 
  ChevronLeft,
  ChevronRight,
  Users,
  CheckCircle,
  AlertTriangle,
  Clock,
  MessageSquare,
  Loader2,
  Heart,
  BookOpen
} from 'lucide-react';
import { BackButton } from '@/components/layout/BackButton';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { format, formatDistanceToNow } from 'date-fns';
import { da } from 'date-fns/locale';
import { HelperHealthWidget } from '@/components/helper/HelperHealthWidget';
import { HelperActivityWidget } from '@/components/helper/HelperActivityWidget';

interface HelperRelation {
  id: string;
  user_id: string;
  can_view_dashboard: boolean;
  can_view_checkins: boolean;
  can_view_tickets: boolean;
  medical_id_verified: boolean;
  medical_id_verified_at: string | null;
  senior_profile?: {
    display_name: string;
    email: string;
  };
  latest_checkin?: {
    completed_at: string;
    score: number;
  };
}

interface WishlistItem {
  id: string;
  item_key: string;
  created_at: string;
}

interface SeniorDetail {
  checkins: Array<{
    id: string;
    completed_at: string;
    score: number;
    recommendations: any;
  }>;
  tickets: Array<{
    id: string;
    subject: string;
    status: string;
    created_at: string;
  }>;
  wishlist: WishlistItem[];
}

// Wishlist item labels (matching Wishlist.tsx)
const wishlistLabels: Record<string, string> = {
  'drtv': 'Se TV på mobilen (DRTV)',
  'audiobooks': 'Høre lydbøger gratis',
  'gps': 'Bruge GPS / Kort',
  'shopping': 'Handle ind på nettet',
  'video-messages': 'Sende videohilsner',
  'netbank': 'Bruge Netbank',
  'facetime': 'FaceTime med familie',
  'photos': 'Organisere billeder',
};

const HelperDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [relations, setRelations] = useState<HelperRelation[]>([]);
  const [selectedSenior, setSelectedSenior] = useState<HelperRelation | null>(null);
  const [seniorDetail, setSeniorDetail] = useState<SeniorDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    fetchRelations();
  }, [user]);

  const fetchRelations = async () => {
    if (!user) return;

    try {
      // Get helper relations where this user is the helper
      const { data: helperData, error } = await supabase
        .from('trusted_helpers')
        .select('*')
        .eq('helper_user_id', user.id)
        .eq('invitation_accepted', true);

      if (error) throw error;

      if (!helperData || helperData.length === 0) {
        setRelations([]);
        setIsLoading(false);
        return;
      }

      // Fetch profile info for each senior
      const enrichedRelations = await Promise.all(
        helperData.map(async (rel) => {
          // Get senior profile
          const { data: profile } = await supabase
            .from('profiles')
            .select('display_name, email')
            .eq('user_id', rel.user_id)
            .single();

          // Get latest checkin if allowed
          let latestCheckin = undefined;
          if (rel.can_view_checkins) {
            const { data: checkin } = await supabase
              .from('checkins')
              .select('completed_at, score')
              .eq('user_id', rel.user_id)
              .order('completed_at', { ascending: false })
              .limit(1)
              .single();
            
            latestCheckin = checkin || undefined;
          }

          return {
            ...rel,
            senior_profile: profile || undefined,
            latest_checkin: latestCheckin,
          };
        })
      );

      setRelations(enrichedRelations);
    } catch (error) {
      console.error('Fetch error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSeniorDetail = async (relation: HelperRelation) => {
    setDetailLoading(true);
    setSelectedSenior(relation);

    try {
      const detail: SeniorDetail = {
        checkins: [],
        tickets: [],
        wishlist: [],
      };

      // Fetch checkins if allowed
      if (relation.can_view_checkins) {
        const { data: checkins } = await supabase
          .from('checkins')
          .select('id, completed_at, score, recommendations')
          .eq('user_id', relation.user_id)
          .order('completed_at', { ascending: false })
          .limit(5);
        
        detail.checkins = checkins || [];
      }

      // Fetch tickets if allowed
      if (relation.can_view_tickets) {
        const { data: tickets } = await supabase
          .from('support_tickets')
          .select('id, subject, status, created_at')
          .eq('user_id', relation.user_id)
          .order('created_at', { ascending: false })
          .limit(5);
        
        detail.tickets = tickets || [];
      }

      // Always fetch wishlist (no special permission needed)
      const { data: wishlist } = await supabase
        .from('user_wishlist')
        .select('id, item_key, created_at')
        .eq('user_id', relation.user_id)
        .order('created_at', { ascending: false });
      
      detail.wishlist = wishlist || [];

      setSeniorDetail(detail);
    } catch (error) {
      console.error('Detail fetch error:', error);
    } finally {
      setDetailLoading(false);
    }
  };

  const getStatusColor = (score: number | null) => {
    if (score === null) return 'text-muted-foreground';
    if (score >= 70) return 'text-success';
    if (score >= 50) return 'text-warning';
    return 'text-destructive';
  };

  const getStatusLabel = (score: number | null) => {
    if (score === null) return 'Ukendt';
    if (score >= 70) return 'Sikker';
    if (score >= 50) return 'Opmærksom';
    return 'Behøver hjælp';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Senior detail view
  if (selectedSenior && seniorDetail) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border sticky top-0 bg-background z-10">
          <div className="container flex h-18 items-center">
            <button 
              onClick={() => {
                setSelectedSenior(null);
                setSeniorDetail(null);
              }}
              className="flex items-center gap-2 text-primary font-medium"
            >
              <ChevronLeft className="h-5 w-5" />
              Tilbage
            </button>
          </div>
        </header>

        <main className="container py-8">
          <div className="max-w-2xl mx-auto">
            <div className="mb-8">
              <h1 className="text-2xl font-bold mb-1">
                {selectedSenior.senior_profile?.display_name || selectedSenior.senior_profile?.email}
              </h1>
              <p className="text-muted-foreground">
                {selectedSenior.senior_profile?.email}
              </p>
            </div>

            {detailLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="space-y-8">
                {/* Health & Activity Widgets */}
                <div className="grid gap-4 md:grid-cols-2">
                  <HelperHealthWidget
                    relationId={selectedSenior.id}
                    seniorName={selectedSenior.senior_profile?.display_name || 'Senioren'}
                    medicalIdVerified={selectedSenior.medical_id_verified || false}
                    medicalIdVerifiedAt={selectedSenior.medical_id_verified_at || null}
                    onUpdate={fetchRelations}
                  />
                  <HelperActivityWidget
                    seniorUserId={selectedSenior.user_id}
                    seniorName={selectedSenior.senior_profile?.display_name || 'Senioren'}
                    latestCheckin={selectedSenior.latest_checkin || null}
                  />
                </div>

                {/* Checkins */}
                {selectedSenior.can_view_checkins && (
                  <div>
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-success" />
                      Seneste tjek
                    </h2>
                    
                    {seniorDetail.checkins.length > 0 ? (
                      <div className="space-y-3">
                        {seniorDetail.checkins.map((checkin) => (
                          <div key={checkin.id} className="card-elevated p-4 flex items-center justify-between">
                            <div>
                              <p className="font-medium">
                                {format(new Date(checkin.completed_at), "d. MMMM yyyy", { locale: da })}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {formatDistanceToNow(new Date(checkin.completed_at), { addSuffix: true, locale: da })}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className={`text-2xl font-bold ${getStatusColor(checkin.score)}`}>
                                {checkin.score}/100
                              </p>
                              <p className={`text-sm ${getStatusColor(checkin.score)}`}>
                                {getStatusLabel(checkin.score)}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="card-elevated p-6 text-center text-muted-foreground">
                        <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>Ingen tjek endnu</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Tickets */}
                {selectedSenior.can_view_tickets && (
                  <div>
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <MessageSquare className="h-5 w-5 text-info" />
                      Support-sager
                    </h2>
                    
                    {seniorDetail.tickets.length > 0 ? (
                      <div className="space-y-3">
                        {seniorDetail.tickets.map((ticket) => (
                          <div key={ticket.id} className="card-elevated p-4 flex items-center justify-between">
                            <div>
                              <p className="font-medium">{ticket.subject}</p>
                              <p className="text-sm text-muted-foreground">
                                {format(new Date(ticket.created_at), "d. MMM yyyy", { locale: da })}
                              </p>
                            </div>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              ticket.status === 'open' ? 'bg-info/10 text-info' :
                              ticket.status === 'resolved' ? 'bg-success/10 text-success' :
                              'bg-muted text-muted-foreground'
                            }`}>
                              {ticket.status === 'open' ? 'Åben' :
                               ticket.status === 'resolved' ? 'Løst' :
                               ticket.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="card-elevated p-6 text-center text-muted-foreground">
                        <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>Ingen support-sager</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Wishlist */}
                {seniorDetail.wishlist.length > 0 && (
                  <div>
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Heart className="h-5 w-5 text-pink-500" />
                      Ønsker at lære
                    </h2>
                    
                    <div className="space-y-3">
                      {seniorDetail.wishlist.map((item) => (
                        <div key={item.id} className="card-elevated p-4 flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-pink-500/10 flex items-center justify-center">
                            <BookOpen className="h-5 w-5 text-pink-500" />
                          </div>
                          <p className="font-medium">
                            {wishlistLabels[item.item_key] || item.item_key}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {!selectedSenior.can_view_checkins && !selectedSenior.can_view_tickets && seniorDetail.wishlist.length === 0 && (
                  <div className="card-elevated p-8 text-center text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Ingen data at vise for denne bruger.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>
    );
  }

  // Main list view
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border sticky top-0 bg-background z-10">
        <div className="container flex h-18 items-center">
          <BackButton />
        </div>
      </header>

      <main className="container py-8">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8">
            <h1 className="text-2xl font-bold mb-2 flex items-center gap-3">
              <Users className="h-7 w-7 text-primary" />
              Dine seniorer
            </h1>
            <p className="text-muted-foreground">
              Her kan du se status for de personer, du hjælper
            </p>
          </div>

          {relations.length > 0 ? (
            <div className="space-y-4">
              {relations.map((rel) => {
                const score = rel.latest_checkin?.score ?? null;
                const needsAttention = score !== null && score < 50;
                
                return (
                  <button
                    key={rel.id}
                    onClick={() => fetchSeniorDetail(rel)}
                    className={`card-interactive p-5 w-full text-left flex items-center gap-4 ${
                      needsAttention ? 'border-destructive/50' : ''
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      needsAttention ? 'bg-destructive/10' : 'bg-success/10'
                    }`}>
                      {needsAttention ? (
                        <AlertTriangle className="h-6 w-6 text-destructive" />
                      ) : (
                        <CheckCircle className="h-6 w-6 text-success" />
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate">
                        {rel.senior_profile?.display_name || rel.senior_profile?.email || 'Ukendt'}
                      </p>
                      
                      {rel.latest_checkin ? (
                        <p className="text-sm text-muted-foreground">
                          Sidste tjek: {formatDistanceToNow(new Date(rel.latest_checkin.completed_at), { addSuffix: true, locale: da })} 
                          {' - '}
                          <span className={getStatusColor(score)}>
                            Score {score}/100
                          </span>
                        </p>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          Intet tjek endnu
                        </p>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        needsAttention 
                          ? 'bg-destructive/10 text-destructive' 
                          : 'bg-success/10 text-success'
                      }`}>
                        {needsAttention ? 'Advarsel' : 'OK'}
                      </span>
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="card-elevated p-12 text-center">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Ingen seniorer endnu</h3>
              <p className="text-muted-foreground">
                Når nogen inviterer dig som hjælper, vil de vises her.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default HelperDashboard;
