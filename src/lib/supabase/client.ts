import { createBrowserClient } from "@supabase/ssr";

/**
 * Browser-side Supabase client.
 * Uses environment variables set in .env.local
 * Safe to use in Client Components.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
