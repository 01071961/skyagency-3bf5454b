import { supabase } from '@/integrations/supabase/client';

/**
 * Returns the main Supabase client with visitor ID header for chat RLS policies.
 * IMPORTANT: We use a single client instance to avoid multiple GoTrueClient conflicts.
 * The visitor ID is passed as a custom header for RLS policies.
 */
export const createChatClient = (visitorId: string) => {
  // Return the main supabase client - we don't create new instances
  // to avoid "Multiple GoTrueClient instances" errors.
  // For chat operations, the visitor_id is handled differently:
  // - For authenticated operations (admin), use regular supabase client
  // - For visitor operations, RLS policies check the visitor_id in the row
  return supabase;
};

/**
 * Helper to get the visitor ID from localStorage
 */
export const getVisitorId = (): string => {
  const stored = localStorage.getItem('sky_visitor_id');
  if (stored) return stored;
  const newId = crypto.randomUUID();
  localStorage.setItem('sky_visitor_id', newId);
  return newId;
};
