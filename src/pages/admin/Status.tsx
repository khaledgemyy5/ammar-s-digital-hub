import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  CheckCircle, XCircle, Loader2, Database, Server, 
  User, HardDrive, RefreshCw, Trash2, Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { isSupabaseConfigured, supabase } from '@/lib/supabaseClient';
import { checkSupabaseHealth, type HealthCheckResult } from '@/lib/supabaseHealth';
import { useAuth } from '@/hooks/useAuth';
import { clearCache } from '@/lib/db';

interface StatusItem {
  label: string;
  status: 'checking' | 'success' | 'error' | 'warning';
  message?: string;
}

export default function AdminStatus() {
  const { user, isAdmin } = useAuth();
  const [statuses, setStatuses] = useState<StatusItem[]>([]);
  const [checking, setChecking] = useState(true);
  const [seeding, setSeeding] = useState(false);

  const runChecks = async () => {
    setChecking(true);
    const results: StatusItem[] = [];

    // 1. Environment Variables
    results.push({
      label: 'Environment Variables',
      status: isSupabaseConfigured() ? 'success' : 'error',
      message: isSupabaseConfigured() 
        ? 'VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set'
        : 'Missing environment variables'
    });

    // 2. Supabase Connection
    const health = await checkSupabaseHealth();
    results.push({
      label: 'Supabase Connection',
      status: health.status === 'connected' ? 'success' : 
              health.status === 'schema_missing' ? 'warning' : 'error',
      message: health.message
    });

    // 3. Database Schema
    if (health.status === 'connected') {
      results.push({
        label: 'Database Schema',
        status: 'success',
        message: 'site_settings table exists'
      });
    } else if (health.status === 'schema_missing') {
      results.push({
        label: 'Database Schema',
        status: 'error',
        message: 'Schema not initialized. Run docs/sql/000_all.sql'
      });
    }

    // 4. Current User
    results.push({
      label: 'Current User',
      status: user ? 'success' : 'error',
      message: user ? user.email : 'Not logged in'
    });

    // 5. Admin Status
    results.push({
      label: 'Admin Status',
      status: isAdmin ? 'success' : 'error',
      message: isAdmin ? 'You are an admin' : 'Not an admin'
    });

    // 6. Storage Bucket
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase.storage.getBucket('assets');
        results.push({
          label: 'Storage Bucket (assets)',
          status: error ? 'warning' : 'success',
          message: error ? 'Bucket not found. Create it in Supabase Storage.' : 'Bucket accessible'
        });
      } catch {
        results.push({
          label: 'Storage Bucket (assets)',
          status: 'warning',
          message: 'Could not check bucket'
        });
      }
    }

    // 7. Site Settings Row
    if (health.status === 'connected') {
      try {
        const { data, error } = await (supabase as any)
          .from('site_settings')
          .select('id, admin_user_id')
          .limit(1)
          .maybeSingle();

        if (data) {
          const settingsData = data as { id: string; admin_user_id: string | null };
          results.push({
            label: 'Site Settings Row',
            status: 'success',
            message: settingsData.admin_user_id 
              ? 'Exists with admin configured' 
              : 'Exists but no admin set'
          });
        } else {
          results.push({
            label: 'Site Settings Row',
            status: 'error',
            message: 'No site_settings row found. Run seed SQL.'
          });
        }
      } catch {
        results.push({
          label: 'Site Settings Row',
          status: 'error',
          message: 'Could not check site_settings'
        });
      }
    }

    setStatuses(results);
    setChecking(false);
  };

  useEffect(() => {
    runChecks();
  }, [user, isAdmin]);

  const getStatusIcon = (status: StatusItem['status']) => {
    switch (status) {
      case 'checking':
        return <Loader2 className="w-5 h-5 animate-spin text-primary" />;
      case 'success':
        return <CheckCircle className="w-5 h-5 text-[hsl(var(--status-public))]" />;
      case 'warning':
        return <XCircle className="w-5 h-5 text-[hsl(var(--status-confidential))]" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-destructive" />;
    }
  };

  const handleSeedDemo = async () => {
    setSeeding(true);
    try {
      // Create demo categories
      const categories = [
        { name: 'Product', slug: 'product', enabled: true, order_index: 0 },
        { name: 'AI/LLM', slug: 'ai-llm', enabled: true, order_index: 1 },
        { name: 'Startups', slug: 'startups', enabled: true, order_index: 2 },
      ];

      for (const cat of categories) {
        await (supabase as any)
          .from('writing_categories')
          .upsert(cat, { onConflict: 'slug' });
      }

      // Get category IDs
      const { data: cats } = await supabase
        .from('writing_categories' as any)
        .select('id, slug');
      
      const catMap = (cats || []).reduce((acc: Record<string, string>, c: any) => {
        acc[c.slug] = c.id;
        return acc;
      }, {});

      // Create demo writing items
      const writingItems = [
        {
          title: 'Building LLM-Powered Features: A Product Manager Guide',
          url: 'https://medium.com/example/llm-features',
          platform_label: 'Medium',
          category_id: catMap['ai-llm'],
          language: 'EN',
          featured: true,
          enabled: true,
          order_index: 0,
        },
        {
          title: 'The Art of Technical Product Management',
          url: 'https://blog.example.com/technical-pm',
          platform_label: 'Personal Blog',
          category_id: catMap['product'],
          language: 'EN',
          featured: true,
          enabled: true,
          order_index: 1,
        },
        {
          title: 'كيف تبني منتجات تقنية ناجحة',
          url: 'https://arabic-platform.com/article',
          platform_label: 'Arabic Platform',
          category_id: catMap['startups'],
          language: 'AR',
          featured: false,
          enabled: true,
          order_index: 2,
        },
      ];

      for (const item of writingItems) {
        if (item.category_id) {
          await (supabase as any)
            .from('writing_items')
            .upsert(item, { onConflict: 'url' });
        }
      }

      // Create demo projects
      const projects = [
        {
          slug: 'ai-recommendation-engine',
          title: 'AI-Powered Recommendation Engine',
          summary: 'Built an LLM-based recommendation system that increased conversion rates by 35% through personalized suggestions.',
          tags: ['AI/LLM', 'Product', 'E-commerce'],
          status: 'PUBLIC',
          detail_level: 'FULL',
          featured: true,
          published: true,
          sections_config: [
            { id: 'snapshot', visible: true, order: 0 },
            { id: 'problem_framing', visible: true, order: 1 },
            { id: 'approach_decisions', visible: true, order: 2 },
            { id: 'outcome_learnings', visible: true, order: 3 },
          ],
          content: {
            snapshot: {
              problem: 'E-commerce platform had low conversion rates due to generic recommendations',
              role: 'Technical Product Manager leading a team of 5 engineers',
              approach: 'Built LLM-powered personalization using embeddings and real-time user signals',
              outcome: '35% increase in conversion, 20% increase in average order value',
            },
            problem_framing: 'Our e-commerce platform was showing the same products to all users, resulting in low engagement and conversion rates. Users were overwhelmed with irrelevant options.',
            approach_decisions: 'We chose to build an LLM-based system that could understand product semantics and user intent. Key decisions included using embeddings for product similarity and implementing real-time personalization.',
            outcome_learnings: 'The system exceeded expectations with 35% conversion improvement. Key learning: personalization works best when combined with clear user intent signals.',
          },
        },
        {
          slug: 'developer-platform-redesign',
          title: 'Developer Platform & API Redesign',
          summary: 'Led the complete redesign of a developer platform serving 50K+ developers, improving onboarding completion by 60%.',
          tags: ['Product', 'Engineering', 'API'],
          status: 'PUBLIC',
          detail_level: 'FULL',
          featured: true,
          published: true,
          sections_config: [
            { id: 'snapshot', visible: true, order: 0 },
            { id: 'problem_framing', visible: true, order: 1 },
          ],
          content: {
            snapshot: {
              problem: 'Developer onboarding was complex with 40% drop-off rate',
              role: 'Product Manager working with platform engineering team',
              approach: 'Redesigned API documentation, added interactive tutorials, simplified authentication',
              outcome: '60% improvement in onboarding completion, NPS increased by 25 points',
            },
          },
        },
        {
          slug: 'startup-mvp-confidential',
          title: 'Startup MVP: From Zero to Launch',
          summary: 'Took a B2B SaaS product from concept to launch in 12 weeks, acquiring first 100 paying customers.',
          tags: ['Startups', 'Product', 'Growth'],
          status: 'CONFIDENTIAL',
          detail_level: 'SUMMARY',
          featured: false,
          published: true,
          confidential_message: 'This project involves confidential startup information. Details have been intentionally limited.',
          sections_config: [
            { id: 'snapshot', visible: true, order: 0 },
          ],
          content: {
            snapshot: {
              problem: 'Market opportunity identified for B2B workflow automation',
              role: 'Co-founder and Product Lead',
              approach: 'Rapid MVP development with tight feedback loops',
              outcome: '100 paying customers in first 3 months',
            },
          },
        },
      ];

      for (const project of projects) {
        await (supabase as any)
          .from('projects')
          .upsert(project, { onConflict: 'slug' });
      }

      clearCache();
      toast.success('Demo content seeded successfully!');
      runChecks();
    } catch (err) {
      console.error('Seed error:', err);
      toast.error('Failed to seed demo content');
    } finally {
      setSeeding(false);
    }
  };

  const handleClearCache = () => {
    clearCache();
    toast.success('Cache cleared');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">System Status</h1>
          <p className="text-muted-foreground">Check your system configuration</p>
        </div>
        <Button onClick={runChecks} disabled={checking} variant="outline">
          <RefreshCw className={`w-4 h-4 mr-2 ${checking ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Status Checks */}
      <Card>
        <CardHeader>
          <CardTitle>Connection Status</CardTitle>
          <CardDescription>Verify all system components are working correctly</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {checking ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            statuses.map((item, index) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg"
              >
                {getStatusIcon(item.status)}
                <div className="flex-1">
                  <p className="font-medium">{item.label}</p>
                  {item.message && (
                    <p className="text-sm text-muted-foreground">{item.message}</p>
                  )}
                </div>
              </motion.div>
            ))
          )}
        </CardContent>
      </Card>

      <Separator />

      {/* Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              Seed Demo Content
            </CardTitle>
            <CardDescription>
              Populate the database with sample projects and writing items.
              Safe to run multiple times (uses upsert).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleSeedDemo} disabled={seeding}>
              {seeding && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Seed Demo Content
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trash2 className="w-5 h-5" />
              Clear Cache
            </CardTitle>
            <CardDescription>
              Clear the in-memory cache to fetch fresh data from the database.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" onClick={handleClearCache}>
              Clear Cache
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
