// Re-export the supabase client from integrations
export { supabase } from '@/integrations/supabase/client';
import { supabase } from '@/integrations/supabase/client';

// Helper to check if Supabase is properly configured
export const isSupabaseConfigured = (): boolean => {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  return Boolean(url && key);
};

// Helper to get current user
export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) {
    console.error('Error getting user:', error);
    return null;
  }
  return user;
};

// Helper to check if current user is admin
export const isAdmin = async (): Promise<boolean> => {
  if (!isSupabaseConfigured()) return false;
  
  try {
    const { data, error } = await supabase.rpc('is_admin');
    if (error) {
      console.error('Error checking admin status:', error);
      return false;
    }
    return data === true;
  } catch {
    return false;
  }
};
