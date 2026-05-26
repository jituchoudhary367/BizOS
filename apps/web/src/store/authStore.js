import { create } from 'zustand';
import { supabase } from '../lib/supabaseClient';

export const useAuthStore = create((set, get) => ({
  user: null,
  profile: null,
  business: null,
  loading: true,
  error: null,

  setDemoMode: () => {
    set({
      user: { id: 'demo-user-id', email: 'demo@bizos.in', phone: '+919876543210' },
      profile: {
        id: 'demo-user-id',
        full_name: 'Demo User',
        role: 'owner',
        business_id: 'demo-business-id'
      },
      business: {
        id: 'demo-business-id',
        name: 'Sharma Hardware Stores',
        type: 'retail',
        gstin: '24AAAAA0000A1Z5',
        phone: '+919876543210'
      },
      loading: false,
      error: null
    });
  },

  initialize: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        set({ user: session.user });
        await get().fetchProfile(session.user.id);
      }
    } catch (error) {
      console.error('Auth init error:', error);
    } finally {
      set({ loading: false });
    }

    // Listen for auth changes
    supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        set({ user: session.user, error: null });
        await get().fetchProfile(session.user.id);
      } else if (event === 'SIGNED_OUT') {
        set({ user: null, profile: null, business: null, error: null });
      } else if (event === 'TOKEN_REFRESHED' && session?.user) {
        set({ user: session.user });
      }
    });
  },

  fetchProfile: async (userId) => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*, businesses(*)')
        .eq('id', userId)
        .single();

      if (error) throw error;

      if (profile) {
        set({
          profile,
          business: profile.businesses,
        });
      }
    } catch (error) {
      console.error('Profile fetch error:', error);
      // Profile may not exist yet (new user completing onboarding)
    }
  },

  signInWithPhone: async (phone) => {
    set({ loading: true, error: null });
    try {
      const { error } = await supabase.auth.signInWithOtp({ phone });
      if (error) throw error;
      return { success: true };
    } catch (error) {
      set({ error: error.message });
      return { success: false, error: error.message };
    } finally {
      set({ loading: false });
    }
  },

  verifyOtp: async (phone, token) => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        phone,
        token,
        type: 'sms',
      });
      if (error) throw error;
      return { success: true, user: data.user };
    } catch (error) {
      set({ error: error.message });
      return { success: false, error: error.message };
    } finally {
      set({ loading: false });
    }
  },

  signInWithGoogle: async () => {
    set({ loading: true, error: null });
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/app/dashboard` },
      });
      if (error) throw error;
    } catch (error) {
      set({ error: error.message });
      return { success: false, error: error.message };
    } finally {
      set({ loading: false });
    }
  },

  signInWithEmail: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      return { success: true, user: data.user };
    } catch (error) {
      set({ error: error.message });
      return { success: false, error: error.message };
    } finally {
      set({ loading: false });
    }
  },

  signUpWithEmail: async (email, password, fullName) => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } },
      });
      if (error) throw error;
      return { success: true, user: data.user };
    } catch (error) {
      set({ error: error.message });
      return { success: false, error: error.message };
    } finally {
      set({ loading: false });
    }
  },

  createBusiness: async ({ name, type, gstin, phone }) => {
    set({ loading: true, error: null });
    try {
      const { user } = get();
      if (!user) throw new Error('Not authenticated');

      // Create business
      const { data: business, error: bError } = await supabase
        .from('businesses')
        .insert({ name, type, gstin, phone })
        .select()
        .single();
      if (bError) throw bError;

      // Create profile
      const { data: profile, error: pError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          business_id: business.id,
          full_name: user.user_metadata?.full_name || name,
          role: 'owner',
        })
        .select()
        .single();
      if (pError) throw pError;

      // Create primary warehouse
      await supabase.from('warehouses').insert({
        business_id: business.id,
        name: 'Main Warehouse',
        is_primary: true,
      });

      set({ business, profile });
      return { success: true, business };
    } catch (error) {
      set({ error: error.message });
      return { success: false, error: error.message };
    } finally {
      set({ loading: false });
    }
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null, profile: null, business: null, error: null });
    try {
      if (window.__QUERY_CLIENT) await window.__QUERY_CLIENT.clear();
    } catch {}
    window.location.href = '/login';
  },
}));
