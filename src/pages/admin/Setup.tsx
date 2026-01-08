import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Loader2, Key, Database, User, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { isSupabaseConfigured, supabase } from '@/lib/supabaseClient';
import { checkSupabaseHealth, type HealthCheckResult } from '@/lib/supabaseHealth';
import { useAuth } from '@/hooks/useAuth';

interface ChecklistItem {
  id: string;
  label: string;
  status: 'pending' | 'checking' | 'success' | 'error';
  message?: string;
}

export default function AdminSetup() {
  const navigate = useNavigate();
  const { user, isAdmin, checkAdminStatus } = useAuth();
  const [checklist, setChecklist] = useState<ChecklistItem[]>([
    { id: 'env', label: 'Environment variables configured', status: 'pending' },
    { id: 'connection', label: 'Supabase connection', status: 'pending' },
    { id: 'schema', label: 'Database schema initialized', status: 'pending' },
    { id: 'admin', label: 'Admin user configured', status: 'pending' },
  ]);
  const [bootstrapToken, setBootstrapToken] = useState('');
  const [bootstrapError, setBootstrapError] = useState('');
  const [bootstrapping, setBootstrapping] = useState(false);
  const [needsBootstrap, setNeedsBootstrap] = useState(false);

  const updateChecklistItem = (id: string, updates: Partial<ChecklistItem>) => {
    setChecklist(prev => prev.map(item => 
      item.id === id ? { ...item, ...updates } : item
    ));
  };

  const runChecks = async () => {
    // Check 1: Environment variables
    updateChecklistItem('env', { status: 'checking' });
    const envConfigured = isSupabaseConfigured();
    updateChecklistItem('env', { 
      status: envConfigured ? 'success' : 'error',
      message: envConfigured ? undefined : 'Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY'
    });

    if (!envConfigured) {
      updateChecklistItem('connection', { status: 'error', message: 'Env vars required first' });
      updateChecklistItem('schema', { status: 'error', message: 'Env vars required first' });
      updateChecklistItem('admin', { status: 'error', message: 'Env vars required first' });
      return;
    }

    // Check 2: Supabase connection
    updateChecklistItem('connection', { status: 'checking' });
    const health: HealthCheckResult = await checkSupabaseHealth();
    
    if (health.status === 'network_error') {
      updateChecklistItem('connection', { status: 'error', message: health.message });
      updateChecklistItem('schema', { status: 'error', message: 'Connection required first' });
      updateChecklistItem('admin', { status: 'error', message: 'Connection required first' });
      return;
    }

    updateChecklistItem('connection', { status: 'success' });

    // Check 3: Database schema
    updateChecklistItem('schema', { status: 'checking' });
    if (health.status === 'schema_missing') {
      updateChecklistItem('schema', { status: 'error', message: 'Run docs/sql/000_all.sql in Supabase SQL Editor' });
      updateChecklistItem('admin', { status: 'error', message: 'Schema required first' });
      return;
    }
    updateChecklistItem('schema', { status: 'success' });

    // Check 4: Admin configured
    updateChecklistItem('admin', { status: 'checking' });
    try {
      const { data: settings } = await supabase
        .from('site_settings' as any)
        .select('admin_user_id, bootstrap_token_hash')
        .limit(1)
        .maybeSingle();

      const settingsRow = settings as { admin_user_id: string | null; bootstrap_token_hash: string | null } | null;
      
      if (!settingsRow) {
        updateChecklistItem('admin', { status: 'error', message: 'No site_settings row found' });
        return;
      }

      if (settingsRow.admin_user_id) {
        updateChecklistItem('admin', { status: 'success', message: 'Admin user set' });
        
        // If already admin, redirect to dashboard
        if (isAdmin) {
          setTimeout(() => navigate('/admin/dashboard'), 1000);
        }
      } else if (settingsRow.bootstrap_token_hash) {
        setNeedsBootstrap(true);
        updateChecklistItem('admin', { 
          status: 'pending', 
          message: 'Enter bootstrap token to claim admin' 
        });
      } else {
        updateChecklistItem('admin', { 
          status: 'error', 
          message: 'No bootstrap token set. Add bootstrap_token_hash to site_settings.'
        });
      }
    } catch (err) {
      updateChecklistItem('admin', { 
        status: 'error', 
        message: err instanceof Error ? err.message : 'Unknown error' 
      });
    }
  };

  useEffect(() => {
    runChecks();
  }, [user, isAdmin]);

  const handleBootstrap = async () => {
    if (!bootstrapToken.trim()) {
      setBootstrapError('Please enter the bootstrap token');
      return;
    }

    if (!user) {
      setBootstrapError('You must be logged in first. Go to /admin/login');
      return;
    }

    setBootstrapping(true);
    setBootstrapError('');

    try {
      const { data, error } = await (supabase as any).rpc('bootstrap_set_admin', { 
        token: bootstrapToken 
      });

      if (error) throw error;

      if (data === true) {
        await checkAdminStatus();
        updateChecklistItem('admin', { status: 'success', message: 'You are now admin!' });
        setTimeout(() => navigate('/admin/dashboard'), 1500);
      } else {
        setBootstrapError('Invalid token or admin already set');
      }
    } catch (err) {
      setBootstrapError(err instanceof Error ? err.message : 'Bootstrap failed');
    } finally {
      setBootstrapping(false);
    }
  };

  const getIcon = (status: ChecklistItem['status']) => {
    switch (status) {
      case 'checking':
        return <Loader2 className="w-5 h-5 animate-spin text-primary" />;
      case 'success':
        return <CheckCircle className="w-5 h-5 text-[hsl(var(--status-public))]" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-destructive" />;
      default:
        return <div className="w-5 h-5 rounded-full border-2 border-muted-foreground" />;
    }
  };

  const allPassed = checklist.every(item => item.status === 'success');

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Admin Setup</h1>
          <p className="text-muted-foreground">
            Complete the following steps to set up admin access
          </p>
        </div>

        <div className="bg-card border border-border rounded-lg p-6 space-y-4">
          {checklist.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-start gap-3"
            >
              <div className="mt-0.5">{getIcon(item.status)}</div>
              <div className="flex-1">
                <p className="font-medium">{item.label}</p>
                {item.message && (
                  <p className="text-sm text-muted-foreground mt-0.5">{item.message}</p>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bootstrap Token Form */}
        {needsBootstrap && user && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 bg-card border border-border rounded-lg p-6"
          >
            <div className="flex items-center gap-2 mb-4">
              <Key className="w-5 h-5 text-primary" />
              <h3 className="font-semibold">Claim Admin Access</h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="token">Bootstrap Token</Label>
                <Input
                  id="token"
                  type="password"
                  value={bootstrapToken}
                  onChange={(e) => setBootstrapToken(e.target.value)}
                  placeholder="Enter your bootstrap token"
                  className="mt-1"
                />
              </div>

              {bootstrapError && (
                <Alert variant="destructive">
                  <AlertDescription>{bootstrapError}</AlertDescription>
                </Alert>
              )}

              <Button 
                onClick={handleBootstrap} 
                disabled={bootstrapping}
                className="w-full"
              >
                {bootstrapping && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Claim Admin
              </Button>
            </div>
          </motion.div>
        )}

        {/* Login Link */}
        {needsBootstrap && !user && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-6 text-center"
          >
            <p className="text-muted-foreground mb-4">
              You need to log in before claiming admin access.
            </p>
            <Button asChild>
              <a href="/admin/login">Go to Login</a>
            </Button>
          </motion.div>
        )}

        {/* Success State */}
        {allPassed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-6 text-center"
          >
            <Button asChild>
              <a href="/admin/dashboard">Go to Dashboard</a>
            </Button>
          </motion.div>
        )}

        {/* Refresh Button */}
        <div className="mt-6 text-center">
          <Button variant="outline" onClick={runChecks}>
            Re-check Status
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
