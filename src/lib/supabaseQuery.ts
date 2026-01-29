/**
 * Utility for making Supabase queries to tables that may not exist in the generated types.
 * This bypasses TypeScript strict checking for table names while maintaining runtime safety.
 */
import { supabase } from '@/integrations/supabase/client';

/**
 * Creates a query builder for any table, bypassing TypeScript strict table name checking.
 * Use this when querying tables that exist in the database but are not yet in the generated types.
 * 
 * @param tableName - The name of the table to query
 * @returns A Supabase query builder
 * 
 * @example
 * const { data, error } = await queryTable('my_custom_table')
 *   .select('*')
 *   .eq('active', true);
 */
export function queryTable(tableName: string) {
  return (supabase as any).from(tableName);
}

/**
 * Safely execute a Supabase query, returning null if the table doesn't exist
 * instead of throwing an error.
 */
export async function safeQuery<T = any>(
  tableName: string,
  queryFn: (builder: any) => any
): Promise<{ data: T[] | null; error: any }> {
  try {
    const builder = queryTable(tableName);
    const result = await queryFn(builder);
    return result;
  } catch (error: any) {
    // Check if it's a "table doesn't exist" error
    if (error?.code === '42P01' || error?.message?.includes('does not exist')) {
      console.warn(`Table "${tableName}" does not exist. Returning empty result.`);
      return { data: null, error: null };
    }
    return { data: null, error };
  }
}
