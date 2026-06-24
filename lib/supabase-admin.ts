import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// This client uses the SERVICE_ROLE_KEY which bypasses Row Level Security.
// NEVER use this on the frontend.
let instance: SupabaseClient | null = null;

export const supabaseAdmin = new Proxy({} as SupabaseClient, {
  get(target, prop) {
    if (!instance) {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
      if (!url || !key) {
        throw new Error(
          `Supabase environment variables missing. Cannot initialize client. NEXT_PUBLIC_SUPABASE_URL=${url}, SUPABASE_SERVICE_ROLE_KEY=${key ? 'present' : 'missing'}`
        );
      }
      instance = createClient(url, key);
    }
    return Reflect.get(instance, prop);
  }
});
