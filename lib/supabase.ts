import { createBrowserClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Initialize Supabase Client specifically for Next.js Client Components
// Uses proper storage adapters to prevent 'Refresh Token Not Found' and SSR hydration errors
export const supabase = createBrowserClient(supabaseUrl, supabaseKey);

// Server-side client (for Edge Functions / API routes with service role)
export function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}
