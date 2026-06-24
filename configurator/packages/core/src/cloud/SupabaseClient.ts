import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export function isSupabaseConfigured(): boolean {
    return Boolean(
        import.meta.env.VITE_SUPABASE_URL &&
        import.meta.env.VITE_SUPABASE_ANON_KEY
    );
}

let supabaseClient: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
    if (!isSupabaseConfigured()) {
        return null;
    }

    if (!supabaseClient) {
        supabaseClient = createClient(
            import.meta.env.VITE_SUPABASE_URL,
            import.meta.env.VITE_SUPABASE_ANON_KEY,
            {
                auth: {
                    persistSession: true,
                    autoRefreshToken: true,
                    detectSessionInUrl: true
                }
            }
        );
    }

    return supabaseClient;
}

/** Auth client — same Supabase client instance. */
export function getSupabaseAuthClient() {
    return getSupabaseClient()?.auth ?? null;
}

/** Database client — same Supabase client instance. */
export function getSupabaseDatabaseClient() {
    return getSupabaseClient();
}

/** Storage client — same Supabase client instance. */
export function getSupabaseStorageClient() {
    return getSupabaseClient()?.storage ?? null;
}
