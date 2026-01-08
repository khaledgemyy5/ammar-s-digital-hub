import { useEffect, useState } from 'react';
import { AlertCircle, Database, Loader2, CheckCircle } from 'lucide-react';
import { checkSupabaseHealth, type HealthCheckResult } from '@/lib/supabaseHealth';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface SupabaseStatusProps {
  showOnSuccess?: boolean;
}

export function SupabaseStatus({ showOnSuccess = false }: SupabaseStatusProps) {
  const [health, setHealth] = useState<HealthCheckResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkSupabaseHealth()
      .then(setHealth)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Alert className="border-muted">
        <Loader2 className="h-4 w-4 animate-spin" />
        <AlertTitle>Checking connection...</AlertTitle>
        <AlertDescription>Verifying Supabase connection</AlertDescription>
      </Alert>
    );
  }

  if (!health) return null;

  // Don't show anything on success unless explicitly requested
  if (health.status === 'connected' && !showOnSuccess) {
    return null;
  }

  if (health.status === 'connected') {
    return (
      <Alert className="border-[hsl(var(--status-public))] bg-[hsl(var(--status-public)/0.1)]">
        <CheckCircle className="h-4 w-4 text-[hsl(var(--status-public))]" />
        <AlertTitle className="text-[hsl(var(--status-public))]">Connected</AlertTitle>
        <AlertDescription>{health.message}</AlertDescription>
      </Alert>
    );
  }

  if (health.status === 'not_configured') {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Supabase Not Configured</AlertTitle>
        <AlertDescription>
          <p className="mb-2">{health.message}</p>
          {health.hint && (
            <p className="text-sm opacity-90">{health.hint}</p>
          )}
        </AlertDescription>
      </Alert>
    );
  }

  if (health.status === 'schema_missing') {
    return (
      <Alert className="border-[hsl(var(--status-confidential))] bg-[hsl(var(--status-confidential)/0.1)]">
        <Database className="h-4 w-4 text-[hsl(var(--status-confidential))]" />
        <AlertTitle className="text-[hsl(var(--status-confidential))]">
          Database Schema Not Initialized
        </AlertTitle>
        <AlertDescription>
          <p className="mb-2">{health.message}</p>
          {health.hint && (
            <p className="text-sm opacity-90">{health.hint}</p>
          )}
        </AlertDescription>
      </Alert>
    );
  }

  // network_error
  return (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Connection Error</AlertTitle>
      <AlertDescription>
        <p className="mb-2">{health.message}</p>
        {health.hint && (
          <p className="text-sm opacity-90">{health.hint}</p>
        )}
      </AlertDescription>
    </Alert>
  );
}
