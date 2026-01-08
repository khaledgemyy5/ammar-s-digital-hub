import { useEffect, useState, ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { isSupabaseConfigured } from '@/lib/supabaseClient';
import { checkSupabaseHealth } from '@/lib/supabaseHealth';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';

interface AdminGuardProps {
  children: ReactNode;
}

export function AdminGuard({ children }: AdminGuardProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAdmin, loading: authLoading } = useAuth();
  const [checking, setChecking] = useState(true);
  const [showForbidden, setShowForbidden] = useState(false);

  useEffect(() => {
    async function checkAccess() {
      // Skip guard for setup and login pages
      if (location.pathname === '/admin/setup' || location.pathname === '/admin/login') {
        setChecking(false);
        return;
      }

      // Check if Supabase is configured
      if (!isSupabaseConfigured()) {
        navigate('/admin/setup', { replace: true });
        return;
      }

      // Check if DB schema exists
      const health = await checkSupabaseHealth();
      if (health.status === 'schema_missing' || health.status === 'not_configured') {
        navigate('/admin/setup', { replace: true });
        return;
      }

      // Wait for auth to finish loading
      if (authLoading) {
        return;
      }

      // Check if user is logged in
      if (!user) {
        navigate('/admin/login', { replace: true });
        return;
      }

      // Check if user is admin
      if (!isAdmin) {
        setShowForbidden(true);
        setChecking(false);
        return;
      }

      setChecking(false);
    }

    checkAccess();
  }, [user, isAdmin, authLoading, location.pathname, navigate]);

  if (checking || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (showForbidden) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center max-w-md p-8">
          <h1 className="text-4xl font-bold text-destructive mb-4">403</h1>
          <h2 className="text-2xl font-semibold mb-4">Access Forbidden</h2>
          <p className="text-muted-foreground mb-6">
            You don't have permission to access this area.
          </p>
          <a href="/" className="text-primary hover:underline">
            Return to Home
          </a>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
