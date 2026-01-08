import { supabase, isSupabaseConfigured } from './supabaseClient';

export type HealthStatus = 
  | 'not_configured'    // env vars missing
  | 'network_error'     // network/auth error
  | 'schema_missing'    // table doesn't exist
  | 'connected';        // success

export interface HealthCheckResult {
  status: HealthStatus;
  message: string;
  hint?: string;
}

/**
 * Check Supabase connection health by attempting a lightweight query.
 * Returns status indicating: missing env, network/auth error, missing table, or success.
 */
export async function checkSupabaseHealth(): Promise<HealthCheckResult> {
  // Check if env vars are configured
  if (!isSupabaseConfigured()) {
    return {
      status: 'not_configured',
      message: 'Supabase not configured',
      hint: 'Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.'
    };
  }

  try {
    // Attempt lightweight query to check connection and schema
    const { data, error } = await supabase
      .from('site_settings' as any)
      .select('id')
      .limit(1)
      .maybeSingle();

    if (error) {
      // Check if it's a "relation does not exist" error (table missing)
      if (
        error.message?.includes('relation') ||
        error.message?.includes('does not exist') ||
        error.code === '42P01' ||
        error.code === 'PGRST116'
      ) {
        return {
          status: 'schema_missing',
          message: 'Database schema not initialized',
          hint: 'Run docs/sql/000_all.sql in your Supabase SQL Editor to set up the database.'
        };
      }

      // Other errors (network, auth, permissions)
      return {
        status: 'network_error',
        message: error.message || 'Connection error',
        hint: 'Check your Supabase URL and anon key, and ensure your project is accessible.'
      };
    }

    // Success - even if data is null (empty table), connection works
    return {
      status: 'connected',
      message: 'Supabase connected successfully'
    };
  } catch (err) {
    return {
      status: 'network_error',
      message: err instanceof Error ? err.message : 'Unknown error',
      hint: 'Check your network connection and Supabase configuration.'
    };
  }
}
