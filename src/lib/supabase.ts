import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./config";

/**
 * Supabase client configured with implicit flow (hash-based redirect)
 * so auth callbacks work in the preview panel without PKCE popup issues.
 * Auth is optional - the app works without signing in.
 */
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    flowType: "implicit",
    detectSessionInUrl: true,
    autoRefreshToken: true,
    persistSession: true,
    storageKey: "tasalli.auth",
  },
});
