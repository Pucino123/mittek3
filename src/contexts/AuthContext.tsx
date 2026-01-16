// AuthContext - Manages authentication, profile, and subscription state
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface Profile {
  id: string;
  user_id: string;
  email: string | null;
  display_name: string | null;
  is_admin: boolean;
  senior_mode_enabled: boolean;
  onboarding_completed: boolean;
  device_preference: 'iphone' | 'ipad' | 'mac' | null;
  owned_devices: string[];
}

interface Subscription {
  id: string;
  plan_tier: 'basic' | 'plus' | 'pro';
  status: 'active' | 'past_due' | 'canceled' | 'incomplete' | 'trialing';
  current_period_end: string | null;
  trial_end: string | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  subscription: Subscription | null;
  isLoading: boolean;
  isAdmin: boolean;
  refetchProfile: () => Promise<void>;
  refetchSubscription: () => Promise<void>;
  signInWithMagicLink: (email: string) => Promise<{ error: Error | null }>;
  signInWithPassword: (email: string, password: string, rememberMe?: boolean) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, displayName?: string) => Promise<{ error: Error | null }>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  hasAccess: (minPlan: 'basic' | 'plus' | 'pro') => boolean;
  isSubscriptionActive: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const planHierarchy = { basic: 1, plus: 2, pro: 3 };

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    
    if (data && !error) {
      setProfile(data as Profile);
    }
  };

  const fetchSubscription = async (userId: string) => {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .in('status', ['active', 'trialing'])
      .order('created_at', { ascending: false })
      .maybeSingle();
    
    if (data && !error) {
      setSubscription(data as Subscription);
    }
  };

  const fetchIsAdmin = async (userId: string) => {
    const { data, error } = await supabase.rpc('is_admin', { _user_id: userId });
    if (!error) setIsAdmin(!!data);
  };

  useEffect(() => {
    let profileChannel: ReturnType<typeof supabase.channel> | null = null;
    let subscriptionChannel: ReturnType<typeof supabase.channel> | null = null;

    const setupRealtimeChannels = (userId: string) => {
      // Set up realtime subscription for profile changes (e.g. admin status)
      profileChannel = supabase
        .channel(`profile-${userId}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'profiles',
            filter: `user_id=eq.${userId}`,
          },
          (payload) => {
            console.log('Profile updated via realtime:', payload.new);
            setProfile(payload.new as Profile);
          }
        )
        .subscribe();

      // Set up realtime subscription for subscription changes (plan upgrades/downgrades)
      subscriptionChannel = supabase
        .channel(`subscription-${userId}`)
        .on(
          'postgres_changes',
          {
            event: '*', // Listen to INSERT, UPDATE, DELETE
            schema: 'public',
            table: 'subscriptions',
            filter: `user_id=eq.${userId}`,
          },
          (payload) => {
            console.log('Subscription updated via realtime:', payload.new);
            if (payload.eventType === 'DELETE') {
              setSubscription(null);
            } else {
              const newSub = payload.new as Subscription;
              // Only update if subscription is active or trialing
              if (newSub.status === 'active' || newSub.status === 'trialing') {
                setSubscription(newSub);
              } else {
                // Re-fetch to get the latest active subscription if any
                fetchSubscription(userId);
              }
            }
          }
        )
        .subscribe();
    };

    const cleanupChannels = () => {
      if (profileChannel) {
        supabase.removeChannel(profileChannel);
        profileChannel = null;
      }
      if (subscriptionChannel) {
        supabase.removeChannel(subscriptionChannel);
        subscriptionChannel = null;
      }
    };

    // Set up auth state listener FIRST
    const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        // Defer Supabase calls with setTimeout to avoid deadlock
        if (session?.user) {
          setTimeout(() => {
            fetchProfile(session.user.id);
            fetchSubscription(session.user.id);
            fetchIsAdmin(session.user.id);
          }, 0);
          
          // Set up realtime channels
          setupRealtimeChannels(session.user.id);
        } else {
          setProfile(null);
          setSubscription(null);
          cleanupChannels();
        }
        
        setIsLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchProfile(session.user.id);
        fetchSubscription(session.user.id);
        fetchIsAdmin(session.user.id);
        
        // Set up realtime channels
        setupRealtimeChannels(session.user.id);
      }
      
      setIsLoading(false);
    });

    return () => {
      authSubscription.unsubscribe();
      cleanupChannels();
    };
  }, []);

  const signInWithMagicLink = async (email: string) => {
    const redirectUrl = `${window.location.origin}/dashboard`;
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: redirectUrl,
      },
    });
    return { error };
  };

  const signInWithPassword = async (email: string, password: string, rememberMe: boolean = true) => {
    // If rememberMe is false, we'll use session storage instead of local storage
    // Supabase handles this via the persistSession option, but we control it here
    if (!rememberMe) {
      // Clear any existing session to force session-only storage
      sessionStorage.setItem('supabase-session-only', 'true');
    } else {
      sessionStorage.removeItem('supabase-session-only');
    }
    
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signUp = async (email: string, password: string, displayName?: string) => {
    const redirectUrl = `${window.location.origin}/dashboard`;
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          display_name: displayName || email.split('@')[0],
        },
      },
    });
    
    // Update the profile with the display name after signup
    // The trigger creates the profile, but we need to update it with the correct name
    if (!error && data.user && displayName) {
      // Small delay to ensure the profile is created by the trigger
      setTimeout(async () => {
        await supabase
          .from('profiles')
          .update({ display_name: displayName })
          .eq('user_id', data.user!.id);
      }, 500);
    }
    
    return { error };
  };

  const resetPassword = async (email: string) => {
    const redirectUrl = `${window.location.origin}/reset-password`;
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl,
    });
    return { error };
  };

  const signOut = async () => {
    // Clear sensitive cached data before signing out
    localStorage.removeItem('mittek-vault-items-cache');
    
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setSubscription(null);
    setIsAdmin(false);
  };

  const hasAccess = (minPlan: 'basic' | 'plus' | 'pro'): boolean => {
    // No subscription = no access (must complete Stripe checkout first)
    if (!subscription) {
      return false;
    }
    
    // Check if subscription is active or trialing (both require completed checkout)
    if (subscription.status !== 'active' && subscription.status !== 'trialing') {
      return false;
    }
    
    const userLevel = planHierarchy[subscription.plan_tier];
    const requiredLevel = planHierarchy[minPlan];
    return userLevel >= requiredLevel;
  };

  const isSubscriptionActive = subscription?.status === 'active' || subscription?.status === 'trialing';

  const refetchProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
      await fetchIsAdmin(user.id);
    }
  };

  const refetchSubscription = async () => {
    if (user) {
      await fetchSubscription(user.id);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      profile,
      subscription,
      isLoading,
      isAdmin,
      refetchProfile,
      refetchSubscription,
      signInWithMagicLink,
      signInWithPassword,
      signUp,
      resetPassword,
      signOut,
      hasAccess,
      isSubscriptionActive,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
