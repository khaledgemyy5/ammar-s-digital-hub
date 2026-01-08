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
    let counts = { settings: 0, categories: 0, items: 0, projects: 0, events: 0 };

    try {
      // 1. Update site_settings
      const settingsUpdate = {
        nav_config: [
          { id: 'home', label: 'Home', path: '/', visible: true, order: 0 },
          { id: 'projects', label: 'Projects', path: '/projects', visible: true, order: 1 },
          { id: 'writing', label: 'Writing', path: '/writing', visible: true, order: 2 },
          { id: 'resume', label: 'Resume', path: '/resume', visible: true, order: 3, isCta: true }
        ],
        home_sections: [
          { id: 'hero', visible: true, order: 0 },
          { id: 'experience_snapshot', visible: true, order: 1, limit: 3 },
          { id: 'featured_projects', visible: true, order: 2, limit: 3 },
          { id: 'how_i_work', visible: true, order: 3 },
          { id: 'selected_writing_preview', visible: true, order: 4, limit: 3 },
          { id: 'contact_cta', visible: true, order: 5 }
        ],
        theme: { accentColor: '#135BEC', defaultMode: 'light', font: 'ibm-plex' },
        seo: {
          siteTitle: 'Ammar Jaber | Technical Product Manager',
          siteDescription: 'Technical Product Manager with expertise in AI/LLM products, developer platforms, and B2B SaaS.'
        },
        pages: {
          resume: { enabled: true, pdfUrl: '', showCopyText: true, showDownload: true },
          contact: { 
            enabled: true, 
            email: 'hello@ammarjaber.com', 
            linkedin: 'https://linkedin.com/in/ammarjaber',
            calendar: 'https://cal.com/ammarjaber'
          }
        }
      };

      const { error: settingsError } = await (supabase as any)
        .from('site_settings')
        .update(settingsUpdate)
        .neq('id', '00000000-0000-0000-0000-000000000000');
      
      if (!settingsError) counts.settings = 1;

      // 2. Create categories
      const categories = [
        { slug: 'product-management', name: 'Product Management', enabled: true, order_index: 0 },
        { slug: 'ai-technology', name: 'AI & Technology', enabled: true, order_index: 1 }
      ];

      for (const cat of categories) {
        const { error } = await (supabase as any)
          .from('writing_categories')
          .upsert(cat, { onConflict: 'slug' });
        if (!error) counts.categories++;
      }

      // 3. Get category IDs
      const { data: cats } = await (supabase as any)
        .from('writing_categories')
        .select('id, slug');
      
      const catMap = (cats || []).reduce((acc: Record<string, string>, c: { id: string; slug: string }) => {
        acc[c.slug] = c.id;
        return acc;
      }, {} as Record<string, string>);

      // 4. Create writing items
      const writingItems = [
        {
          title: 'Building LLM-Powered Features: A Product Manager\'s Guide',
          url: 'https://medium.com/@ammarjaber/llm-features-guide',
          platform_label: 'Medium',
          category_id: catMap['ai-technology'],
          language: 'EN',
          featured: true,
          enabled: true,
          order_index: 0,
          show_why: true,
          why_this_matters: 'Practical frameworks for shipping AI features that actually solve user problems.'
        },
        {
          title: 'The Art of Technical Product Specifications',
          url: 'https://blog.ammarjaber.com/technical-specs',
          platform_label: 'Personal Blog',
          category_id: catMap['product-management'],
          language: 'EN',
          featured: true,
          enabled: true,
          order_index: 1,
          show_why: false
        },
        {
          title: 'Why Most MVPs Fail (And How to Avoid It)',
          url: 'https://medium.com/@ammarjaber/mvp-failures',
          platform_label: 'Medium',
          category_id: catMap['product-management'],
          language: 'EN',
          featured: true,
          enabled: true,
          order_index: 2,
          show_why: true,
          why_this_matters: 'Common anti-patterns I\'ve seen in 50+ product launches.'
        },
        {
          title: 'كيف تبني منتجات تقنية ناجحة في السوق العربي',
          url: 'https://arabic-tech.com/articles/building-products',
          platform_label: 'Arabic Tech',
          category_id: catMap['product-management'],
          language: 'AR',
          featured: false,
          enabled: true,
          order_index: 3,
          show_why: true,
          why_this_matters: 'دروس مستفادة من بناء منتجات تقنية في منطقة الشرق الأوسط.'
        },
        {
          title: 'مستقبل الذكاء الاصطناعي في المنتجات الرقمية',
          url: 'https://arabic-tech.com/articles/ai-future',
          platform_label: 'Arabic Tech',
          category_id: catMap['ai-technology'],
          language: 'AR',
          featured: false,
          enabled: true,
          order_index: 4,
          show_why: false
        },
        {
          title: 'API Design Principles for Developer Experience',
          url: 'https://dev.to/ammarjaber/api-design-dx',
          platform_label: 'Dev.to',
          category_id: catMap['ai-technology'],
          language: 'EN',
          featured: false,
          enabled: true,
          order_index: 5,
          show_why: false
        }
      ];

      for (const item of writingItems) {
        if (item.category_id) {
          const { error } = await (supabase as any)
            .from('writing_items')
            .upsert(item, { onConflict: 'url' });
          if (!error) counts.items++;
        }
      }

      // 5. Create projects
      const projects = [
        {
          slug: 'ai-recommendation-engine',
          title: 'AI-Powered Recommendation Engine',
          summary: 'Led the development of an LLM-based recommendation system that increased conversion rates by 35% through personalized product suggestions.',
          tags: ['AI/LLM', 'E-commerce', 'Product'],
          status: 'PUBLIC',
          detail_level: 'FULL',
          featured: true,
          published: true,
          sections_config: [
            { id: 'overview', visible: true, order: 0 },
            { id: 'problem', visible: true, order: 1 },
            { id: 'approach', visible: true, order: 2 },
            { id: 'impact', visible: true, order: 3 },
            { id: 'learnings', visible: true, order: 4 }
          ],
          content: {
            overview: 'Designed and shipped an AI-powered recommendation system for a major e-commerce platform serving 2M+ monthly active users.',
            problem: 'The existing recommendation engine relied on basic collaborative filtering, resulting in generic suggestions with stagnant 2.1% conversion rates.',
            approach: 'Built a hybrid system combining LLM embeddings for semantic understanding with real-time behavioral signals.',
            impact: '35% increase in conversion rate, 20% increase in AOV, 10M+ daily recommendations with <50ms latency.',
            learnings: 'Personalization works best when combined with clear user intent signals. Invest early in A/B testing infrastructure.'
          },
          metrics: [
            { label: 'Conversion Increase', value: '+35%' },
            { label: 'AOV Increase', value: '+20%' },
            { label: 'Daily Recommendations', value: '10M+' }
          ]
        },
        {
          slug: 'developer-platform-redesign',
          title: 'Developer Platform & API Redesign',
          summary: 'Led complete redesign of a developer platform serving 50K+ developers. Improved onboarding completion by 60%.',
          tags: ['Developer Experience', 'API', 'Platform'],
          status: 'PUBLIC',
          detail_level: 'FULL',
          featured: true,
          published: true,
          sections_config: [
            { id: 'overview', visible: true, order: 0 },
            { id: 'problem', visible: true, order: 1 },
            { id: 'approach', visible: true, order: 2 },
            { id: 'impact', visible: true, order: 3 }
          ],
          content: {
            overview: 'Redesigned a B2B developer platform from the ground up, focusing on developer experience and time-to-first-API-call.',
            problem: 'Developer onboarding had a 40% drop-off rate. Authentication was complex (7 steps), and NPS was -15.',
            approach: 'Reduced auth from 7 steps to 2, built interactive API explorer, added code snippets in 8 languages.',
            impact: 'Onboarding completion improved to 96%. Time-to-first-API-call reduced to 8min. Developer NPS increased to +42.'
          },
          metrics: [
            { label: 'Onboarding Completion', value: '96%' },
            { label: 'Time to First Call', value: '8min' },
            { label: 'Developer NPS', value: '+42' }
          ]
        },
        {
          slug: 'mobile-app-growth-engine',
          title: 'Mobile App Growth & Retention Engine',
          summary: 'Built a data-driven growth engine that increased 30-day retention by 45% through personalized onboarding and gamification.',
          tags: ['Growth', 'Mobile', 'Data'],
          status: 'PUBLIC',
          detail_level: 'FULL',
          featured: true,
          published: true,
          sections_config: [
            { id: 'overview', visible: true, order: 0 },
            { id: 'problem', visible: true, order: 1 },
            { id: 'impact', visible: true, order: 2 }
          ],
          content: {
            overview: 'Designed a comprehensive growth system for a consumer mobile app with 500K+ downloads.',
            problem: 'Strong acquisition (100K+ monthly downloads) but poor retention (15% after 30 days). Users churned before experiencing value.',
            impact: '30-day retention increased to 22% (+45%). DAU grew 3x over 6 months. Referral rate increased by 60%.'
          },
          metrics: [
            { label: '30-Day Retention', value: '+45%' },
            { label: 'DAU Growth', value: '3x' },
            { label: 'Referral Rate', value: '+60%' }
          ]
        },
        {
          slug: 'enterprise-saas-platform',
          title: 'Enterprise SaaS Platform',
          summary: 'Led product strategy for a B2B SaaS platform serving Fortune 500 companies. Drove 200% ARR growth.',
          tags: ['Enterprise', 'B2B SaaS', 'Strategy'],
          status: 'CONFIDENTIAL',
          detail_level: 'SUMMARY',
          featured: false,
          published: true,
          confidential_message: 'This project contains confidential business information. Details have been intentionally limited.',
          sections_config: [
            { id: 'overview', visible: true, order: 0 }
          ],
          content: {
            overview: 'Managed product roadmap for an enterprise workflow automation platform. Achieved SOC 2 Type II and HIPAA compliance.'
          },
          metrics: [
            { label: 'ARR Growth', value: '200%' },
            { label: 'Fortune 500 Customers', value: '3' }
          ]
        },
        {
          slug: 'fintech-payment-integration',
          title: 'Fintech Payment Infrastructure',
          summary: 'Architected payment processing infrastructure handling $50M+ monthly transactions.',
          tags: ['Fintech', 'Payments', 'Infrastructure'],
          status: 'CONFIDENTIAL',
          detail_level: 'MINIMAL',
          featured: false,
          published: true,
          confidential_message: 'Payment infrastructure details are confidential due to security and regulatory requirements.',
          sections_config: [
            { id: 'overview', visible: true, order: 0 }
          ],
          content: {
            overview: 'Led the redesign of payment infrastructure for a high-growth fintech with smart retry logic and fraud detection.'
          },
          metrics: [
            { label: 'Monthly Volume', value: '$50M+' },
            { label: 'Failure Reduction', value: '-60%' }
          ]
        },
        {
          slug: 'ai-agent-framework',
          title: 'AI Agent Orchestration Framework',
          summary: 'Exploring a framework for orchestrating multiple AI agents to handle complex, multi-step tasks.',
          tags: ['AI/LLM', 'Agents', 'Framework'],
          status: 'CONCEPT',
          detail_level: 'SUMMARY',
          featured: false,
          published: true,
          sections_config: [
            { id: 'overview', visible: true, order: 0 },
            { id: 'approach', visible: true, order: 1 }
          ],
          content: {
            overview: 'A conceptual exploration of how to build reliable AI agent systems with error handling and human-in-the-loop workflows.',
            approach: 'Investigating hierarchical agents, peer-to-peer collaboration, and checkpoint patterns.'
          }
        }
      ];

      for (const project of projects) {
        const { error } = await (supabase as any)
          .from('projects')
          .upsert(project, { onConflict: 'slug' });
        if (!error) counts.projects++;
      }

      // 6. Add sample analytics events
      const sampleEvents = [
        { sid: crypto.randomUUID(), event: 'page_view', path: '/' },
        { sid: crypto.randomUUID(), event: 'page_view', path: '/projects' },
        { sid: crypto.randomUUID(), event: 'project_view', path: '/projects/ai-recommendation-engine', ref: 'ai-recommendation-engine' },
        { sid: crypto.randomUUID(), event: 'resume_download', path: '/resume' },
        { sid: crypto.randomUUID(), event: 'contact_click', path: '/contact', ref: 'linkedin' }
      ];

      for (const evt of sampleEvents) {
        const { error } = await (supabase as any)
          .from('analytics_events')
          .insert(evt);
        if (!error) counts.events++;
      }

      clearCache();
      toast.success(
        `Demo seeded: ${counts.settings} settings, ${counts.categories} categories, ${counts.items} writing items, ${counts.projects} projects, ${counts.events} events`
      );
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
