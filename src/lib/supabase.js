import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL || "https://bxynrnkhnpwsbxamsxpt.supabase.co";
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || "sb_publishable_IMAFZHjbxX97w4mRycjOcA_Uj-nS8Qh";

export const supabaseConfigured = Boolean(url && publishableKey);
export const supabase = supabaseConfigured
  ? createClient(url, publishableKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : {
      auth: {
        signInWithPassword: async () => ({ data: null, error: new Error("Supabase is not configured.") }),
        signUp: async () => ({ data: null, error: new Error("Supabase is not configured.") }),
        signOut: async () => ({ error: null }),
        getSession: async () => ({ data: { session: null }, error: null }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
      },
      from: () => ({
        select() { return this; },
        eq() { return this; },
        order() { return this; },
        limit() { return this; },
        maybeSingle: async () => ({ data: null, error: new Error("Supabase is not configured.") }),
        then(resolve) { return Promise.resolve({ data: [], error: new Error("Supabase is not configured.") }).then(resolve); },
      }),
    };
