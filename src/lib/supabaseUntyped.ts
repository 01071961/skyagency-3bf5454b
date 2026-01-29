/**
 * Untyped Supabase client for accessing tables not in the generated types.
 * Use this when the database has tables that TypeScript doesn't know about yet.
 */
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://pfqhspnyejzohxwaqnyb.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmcWhzcG55ZWp6b2h4d2FxbnliIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg5NTQ2NjksImV4cCI6MjA4NDUzMDY2OX0.yuFMCxVKrD4we1LlPXWBx3vETi2OIcurG7DjtLSTXB4';

// Create an untyped client that can query any table
export const supabaseUntyped = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});

// Helper to get untyped supabase client
export function getUntypedClient() {
  return supabaseUntyped;
}
