import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { BackButton } from '@/components/layout/BackButton';
import { useScrollRestoration } from '@/hooks/useScrollRestoration';
import { 
  Heart,
  Tv,
  Headphones,
  MapPin,
  ShoppingCart,
  Video,
  Loader2,
  CheckCircle2
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface WishlistItem {
  key: string;
  title: string;
  description: string;
  icon: typeof Heart;
}

const wishlistItems: WishlistItem[] = [
  {
    key: 'streaming-tv',
    title: 'Se TV på mobilen',
    description: 'Lær at bruge DRTV og andre streaming-tjenester',
    icon: Tv,
  },
  {
    key: 'audiobooks',
    title: 'Høre lydbøger gratis',
    description: 'Find gratis lydbøger via biblioteket',
    icon: Headphones,
  },
  {
    key: 'gps-navigation',
    title: 'Bruge GPS / Kort',
    description: 'Find vej med Google Maps eller Apple Kort',
    icon: MapPin,
  },
  {
    key: 'online-shopping',
    title: 'Handle ind på nettet',
    description: 'Køb dagligvarer og andre ting online',
    icon: ShoppingCart,
  },
  {
    key: 'video-calls',
    title: 'Sende videohilsner',
    description: 'Ring med video til familie og venner',
    icon: Video,
  },
];

const Wishlist = () => {
  useScrollRestoration();

  const { user } = useAuth();
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      fetchWishlist();
    }
  }, [user]);

  const fetchWishlist = async () => {
    try {
      const { data, error } = await supabase
        .from('user_wishlist')
        .select('item_key')
        .eq('user_id', user!.id);

      if (error) throw error;

      setSelectedItems(new Set(data?.map(item => item.item_key) || []));
    } catch (error) {
      console.error('Error fetching wishlist:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleItem = async (key: string) => {
    if (!user) return;
    
    setSaving(true);
    const isSelected = selectedItems.has(key);
    
    try {
      if (isSelected) {
        // Remove from wishlist
        const { error } = await supabase
          .from('user_wishlist')
          .delete()
          .eq('user_id', user.id)
          .eq('item_key', key);

        if (error) throw error;

        setSelectedItems(prev => {
          const next = new Set(prev);
          next.delete(key);
          return next;
        });
        toast.success('Fjernet fra ønskeseddel');
      } else {
        // Add to wishlist
        const { error } = await supabase
          .from('user_wishlist')
          .insert({ user_id: user.id, item_key: key });

        if (error) throw error;

        setSelectedItems(prev => new Set([...prev, key]));
        toast.success('Tilføjet til ønskeseddel');
      }
    } catch (error) {
      console.error('Error updating wishlist:', error);
      toast.error('Kunne ikke opdatere ønskeseddel');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="container flex h-18 items-center">
          <BackButton />
        </div>
      </header>

      <main className="container py-8">
        <div className="max-w-xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 rounded-full bg-primary/10 mx-auto mb-4 flex items-center justify-center">
              <Heart className="h-10 w-10 text-primary" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Lærings-Ønskeseddel</h1>
            <p className="text-muted-foreground">
              Hvad vil du gerne lære? Tryk på emnerne, så din hjælper kan se det.
            </p>
          </div>

          {/* Items grid */}
          <div className="space-y-3 mb-8">
            {wishlistItems.map((item) => {
              const isSelected = selectedItems.has(item.key);
              const ItemIcon = item.icon;
              
              return (
                <button
                  key={item.key}
                  onClick={() => toggleItem(item.key)}
                  disabled={saving}
                  className={`w-full p-5 rounded-2xl border-2 transition-all flex items-center gap-4 text-left ${
                    isSelected 
                      ? 'border-primary bg-primary/5' 
                      : 'border-border bg-card hover:border-muted-foreground/30'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    isSelected ? 'bg-primary/10' : 'bg-muted'
                  }`}>
                    <ItemIcon className={`h-6 w-6 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold mb-0.5">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </div>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted'
                  }`}>
                    {isSelected ? (
                      <Heart className="h-4 w-4 fill-current" />
                    ) : (
                      <Heart className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Summary */}
          {selectedItems.size > 0 && (
            <div className="card-elevated p-6 text-center">
              <CheckCircle2 className="h-8 w-8 text-success mx-auto mb-3" />
              <p className="text-muted-foreground">
                Du har valgt <span className="font-semibold text-foreground">{selectedItems.size}</span> emne{selectedItems.size !== 1 ? 'r' : ''}.
                <br />
                Din hjælper kan nu se, hvad du gerne vil lære.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Wishlist;
