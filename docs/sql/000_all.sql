-- ============================================================
-- Ammar Resume - Full Database Schema (Idempotent)
-- Run this script in Supabase SQL Editor
-- Safe to run multiple times
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- ENUMS (DROP IF EXISTS for idempotency)
-- ============================================================

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'project_status') THEN
        CREATE TYPE project_status AS ENUM ('PUBLIC', 'CONFIDENTIAL', 'CONCEPT');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'detail_level') THEN
        CREATE TYPE detail_level AS ENUM ('FULL', 'SUMMARY', 'MINIMAL');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'language_type') THEN
        CREATE TYPE language_type AS ENUM ('AUTO', 'AR', 'EN');
    END IF;
END$$;

-- ============================================================
-- TABLES
-- ============================================================

-- Site Settings (singleton)
CREATE TABLE IF NOT EXISTS public.site_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nav_config JSONB NOT NULL DEFAULT '[]',
  home_sections JSONB NOT NULL DEFAULT '[]',
  theme JSONB NOT NULL DEFAULT '{"accentColor": "#135BEC", "defaultMode": "light", "font": "ibm-plex"}',
  seo JSONB NOT NULL DEFAULT '{"siteTitle": "Ammar Jaber", "siteDescription": "Technical Product Manager"}',
  pages JSONB NOT NULL DEFAULT '{"resume": {"enabled": true, "showCopyText": true, "showDownload": true}, "contact": {"enabled": true}}',
  admin_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  bootstrap_token_hash TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Projects
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  summary TEXT,
  tags TEXT[] DEFAULT '{}',
  status project_status NOT NULL DEFAULT 'PUBLIC',
  detail_level detail_level NOT NULL DEFAULT 'FULL',
  featured BOOLEAN DEFAULT FALSE,
  published BOOLEAN DEFAULT FALSE,
  sections_config JSONB DEFAULT '[]',
  content JSONB DEFAULT '{}',
  metrics JSONB DEFAULT '{}',
  decision_log JSONB DEFAULT '[]',
  media JSONB DEFAULT '{"items": []}',
  confidential_message TEXT,
  related_projects TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Writing Categories
CREATE TABLE IF NOT EXISTS public.writing_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  enabled BOOLEAN DEFAULT TRUE,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Writing Items
CREATE TABLE IF NOT EXISTS public.writing_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id UUID REFERENCES public.writing_categories(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  platform_label TEXT,
  language language_type DEFAULT 'AUTO',
  featured BOOLEAN DEFAULT FALSE,
  enabled BOOLEAN DEFAULT TRUE,
  order_index INTEGER DEFAULT 0,
  why_this_matters TEXT,
  show_why BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add unique constraint on url if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'writing_items_url_key') THEN
        ALTER TABLE public.writing_items ADD CONSTRAINT writing_items_url_key UNIQUE (url);
    END IF;
EXCEPTION WHEN duplicate_object THEN
    NULL;
END$$;

-- Analytics Events
CREATE TABLE IF NOT EXISTS public.analytics_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event TEXT NOT NULL,
  path TEXT,
  ref TEXT,
  sid TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- INDEXES for Performance
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_projects_published ON public.projects(published);
CREATE INDEX IF NOT EXISTS idx_projects_featured ON public.projects(featured);
CREATE INDEX IF NOT EXISTS idx_projects_slug ON public.projects(slug);
CREATE INDEX IF NOT EXISTS idx_writing_items_category ON public.writing_items(category_id);
CREATE INDEX IF NOT EXISTS idx_writing_items_enabled ON public.writing_items(enabled);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created ON public.analytics_events(created_at);
CREATE INDEX IF NOT EXISTS idx_analytics_events_event ON public.analytics_events(event);

-- ============================================================
-- FUNCTIONS
-- ============================================================

-- Check if current user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.site_settings
    WHERE admin_user_id = auth.uid()
  )
$$;

-- Bootstrap set admin (first-time setup with bcrypt)
CREATE OR REPLACE FUNCTION public.bootstrap_set_admin(token TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  settings_row site_settings%ROWTYPE;
BEGIN
  SELECT * INTO settings_row FROM site_settings LIMIT 1;
  
  -- If admin already set, reject
  IF settings_row.admin_user_id IS NOT NULL THEN
    RETURN FALSE;
  END IF;
  
  -- If no bootstrap token set, reject
  IF settings_row.bootstrap_token_hash IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Verify token using bcrypt
  IF settings_row.bootstrap_token_hash != crypt(token, settings_row.bootstrap_token_hash) THEN
    RETURN FALSE;
  END IF;
  
  -- Set admin user and clear token
  UPDATE site_settings 
  SET admin_user_id = auth.uid(), 
      bootstrap_token_hash = NULL,
      updated_at = NOW()
  WHERE id = settings_row.id;
  
  RETURN TRUE;
END;
$$;

-- Helper function to set bootstrap token (run once during setup)
CREATE OR REPLACE FUNCTION public.set_bootstrap_token(plaintext_token TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE site_settings 
  SET bootstrap_token_hash = crypt(plaintext_token, gen_salt('bf'))
  WHERE id = (SELECT id FROM site_settings LIMIT 1);
END;
$$;

-- ============================================================
-- TRIGGERS
-- ============================================================

-- Updated at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
DROP TRIGGER IF EXISTS update_site_settings_updated_at ON public.site_settings;
CREATE TRIGGER update_site_settings_updated_at
  BEFORE UPDATE ON public.site_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_projects_updated_at ON public.projects;
CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_writing_categories_updated_at ON public.writing_categories;
CREATE TRIGGER update_writing_categories_updated_at
  BEFORE UPDATE ON public.writing_categories
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_writing_items_updated_at ON public.writing_items;
CREATE TRIGGER update_writing_items_updated_at
  BEFORE UPDATE ON public.writing_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.writing_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.writing_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- Drop existing policies first for idempotency
DROP POLICY IF EXISTS "Public can read site settings" ON public.site_settings;
DROP POLICY IF EXISTS "Admin can update site settings" ON public.site_settings;
DROP POLICY IF EXISTS "Public can read published projects" ON public.projects;
DROP POLICY IF EXISTS "Admin can CRUD projects" ON public.projects;
DROP POLICY IF EXISTS "Public can read enabled categories" ON public.writing_categories;
DROP POLICY IF EXISTS "Admin can CRUD categories" ON public.writing_categories;
DROP POLICY IF EXISTS "Public can read enabled items" ON public.writing_items;
DROP POLICY IF EXISTS "Admin can CRUD items" ON public.writing_items;
DROP POLICY IF EXISTS "Anyone can insert analytics" ON public.analytics_events;
DROP POLICY IF EXISTS "Admin can read analytics" ON public.analytics_events;

-- Site Settings Policies
CREATE POLICY "Public can read site settings" ON public.site_settings
  FOR SELECT USING (true);

CREATE POLICY "Admin can update site settings" ON public.site_settings
  FOR UPDATE USING (public.is_admin());

-- Projects Policies
CREATE POLICY "Public can read published projects" ON public.projects
  FOR SELECT USING (published = true);

CREATE POLICY "Admin can CRUD projects" ON public.projects
  FOR ALL USING (public.is_admin());

-- Writing Categories Policies
CREATE POLICY "Public can read enabled categories" ON public.writing_categories
  FOR SELECT USING (enabled = true);

CREATE POLICY "Admin can CRUD categories" ON public.writing_categories
  FOR ALL USING (public.is_admin());

-- Writing Items Policies
CREATE POLICY "Public can read enabled items" ON public.writing_items
  FOR SELECT USING (enabled = true);

CREATE POLICY "Admin can CRUD items" ON public.writing_items
  FOR ALL USING (public.is_admin());

-- Analytics Events Policies
CREATE POLICY "Anyone can insert analytics" ON public.analytics_events
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admin can read analytics" ON public.analytics_events
  FOR SELECT USING (public.is_admin());

-- ============================================================
-- SEED DATA (Idempotent using ON CONFLICT)
-- ============================================================

-- Seed site_settings if empty
INSERT INTO public.site_settings (nav_config, home_sections, theme, seo, pages)
SELECT 
  '[{"id":"home","label":"Home","path":"/","visible":true,"order":0},{"id":"projects","label":"Projects","path":"/projects","visible":true,"order":1},{"id":"writing","label":"Writing","path":"/writing","visible":true,"order":2},{"id":"contact","label":"Contact","path":"/contact","visible":true,"order":3}]'::jsonb,
  '[{"id":"hero","visible":true,"order":0},{"id":"experience_snapshot","visible":true,"order":1,"limit":3},{"id":"featured_projects","visible":true,"order":2,"limit":3},{"id":"how_i_work","visible":true,"order":3},{"id":"selected_writing_preview","visible":true,"order":4,"limit":3},{"id":"contact_cta","visible":true,"order":5}]'::jsonb,
  '{"accentColor":"#135BEC","defaultMode":"light","font":"ibm-plex"}'::jsonb,
  '{"siteTitle":"Ammar Jaber | Technical Product Manager","siteDescription":"Technical Product Manager with experience in LLM and Software Engineering. Building products that matter."}'::jsonb,
  '{"resume":{"enabled":true,"showCopyText":true,"showDownload":true},"contact":{"enabled":true,"email":"hello@ammarjaber.com","linkedin":"https://linkedin.com/in/ammarjaber"}}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM public.site_settings);

-- Seed writing categories
INSERT INTO public.writing_categories (name, slug, enabled, order_index) VALUES
  ('Product Management', 'product', true, 0),
  ('AI & LLM', 'ai-llm', true, 1),
  ('Startups', 'startups', true, 2),
  ('Leadership', 'leadership', true, 3)
ON CONFLICT (slug) DO NOTHING;

-- Seed writing items (get category IDs dynamically)
INSERT INTO public.writing_items (category_id, title, url, platform_label, language, featured, enabled, order_index, why_this_matters, show_why)
SELECT 
  (SELECT id FROM public.writing_categories WHERE slug = 'ai-llm'),
  'Building LLM-Powered Features: A Product Manager''s Guide',
  'https://medium.com/@ammarjaber/llm-features-guide',
  'Medium',
  'EN'::language_type,
  true,
  true,
  0,
  'This guide distills 2 years of building with LLMs into actionable frameworks for PMs.',
  true
WHERE NOT EXISTS (SELECT 1 FROM public.writing_items WHERE url = 'https://medium.com/@ammarjaber/llm-features-guide');

INSERT INTO public.writing_items (category_id, title, url, platform_label, language, featured, enabled, order_index)
SELECT 
  (SELECT id FROM public.writing_categories WHERE slug = 'product'),
  'The Art of Technical Product Management',
  'https://blog.ammarjaber.com/technical-pm',
  'Personal Blog',
  'EN'::language_type,
  true,
  true,
  1
WHERE NOT EXISTS (SELECT 1 FROM public.writing_items WHERE url = 'https://blog.ammarjaber.com/technical-pm');

INSERT INTO public.writing_items (category_id, title, url, platform_label, language, featured, enabled, order_index)
SELECT 
  (SELECT id FROM public.writing_categories WHERE slug = 'startups'),
  'كيف تبني منتجات تقنية ناجحة في العالم العربي',
  'https://arabic-platform.com/ammar-article',
  'منصة عربية',
  'AR'::language_type,
  false,
  true,
  2
WHERE NOT EXISTS (SELECT 1 FROM public.writing_items WHERE url = 'https://arabic-platform.com/ammar-article');

INSERT INTO public.writing_items (category_id, title, url, platform_label, language, featured, enabled, order_index)
SELECT 
  (SELECT id FROM public.writing_categories WHERE slug = 'leadership'),
  'From Engineer to PM: Lessons Learned',
  'https://linkedin.com/pulse/engineer-pm-lessons',
  'LinkedIn',
  'EN'::language_type,
  false,
  true,
  3
WHERE NOT EXISTS (SELECT 1 FROM public.writing_items WHERE url = 'https://linkedin.com/pulse/engineer-pm-lessons');

INSERT INTO public.writing_items (category_id, title, url, platform_label, language, featured, enabled, order_index)
SELECT 
  (SELECT id FROM public.writing_categories WHERE slug = 'ai-llm'),
  'RAG Architecture Patterns for Production',
  'https://medium.com/@ammarjaber/rag-patterns',
  'Medium',
  'EN'::language_type,
  true,
  true,
  4
WHERE NOT EXISTS (SELECT 1 FROM public.writing_items WHERE url = 'https://medium.com/@ammarjaber/rag-patterns');

INSERT INTO public.writing_items (category_id, title, url, platform_label, language, featured, enabled, order_index)
SELECT 
  (SELECT id FROM public.writing_categories WHERE slug = 'startups'),
  'MVP Development: Speed vs Quality Trade-offs',
  'https://blog.ammarjaber.com/mvp-tradeoffs',
  'Personal Blog',
  'EN'::language_type,
  false,
  true,
  5
WHERE NOT EXISTS (SELECT 1 FROM public.writing_items WHERE url = 'https://blog.ammarjaber.com/mvp-tradeoffs');

-- Seed projects
INSERT INTO public.projects (slug, title, summary, tags, status, detail_level, featured, published, sections_config, content) VALUES
  (
    'ai-recommendation-engine',
    'AI-Powered Recommendation Engine',
    'Built an LLM-based recommendation system that increased conversion rates by 35% through personalized suggestions.',
    ARRAY['AI/LLM', 'E-commerce', 'Product'],
    'PUBLIC',
    'FULL',
    true,
    true,
    '[{"id":"snapshot","visible":true,"order":0},{"id":"problem_framing","visible":true,"order":1},{"id":"approach_decisions","visible":true,"order":2},{"id":"outcome_learnings","visible":true,"order":3},{"id":"evidence_pack","visible":true,"order":4}]'::jsonb,
    '{
      "snapshot": {
        "problem": "E-commerce platform had low conversion rates due to generic, one-size-fits-all product recommendations",
        "role": "Technical Product Manager leading a cross-functional team of 5 engineers and 2 data scientists",
        "approach": "Built LLM-powered personalization using embeddings and real-time user signals",
        "outcome": "35% increase in conversion rate, 20% increase in average order value"
      },
      "problem_framing": "Our e-commerce platform was showing the same products to all users regardless of their preferences, browsing history, or purchase patterns. This resulted in low engagement rates (under 2% click-through on recommendations) and missed revenue opportunities.",
      "approach_decisions": "We evaluated three approaches: rule-based filtering, traditional ML collaborative filtering, and LLM-based semantic understanding. We chose LLMs because they could understand product descriptions and user intent at a deeper level. Key technical decisions included using OpenAI embeddings for product similarity and implementing a hybrid retrieval system.",
      "outcome_learnings": "The system exceeded our initial 20% improvement target. Key learnings: 1) Real-time personalization outperformed batch processing, 2) Combining semantic search with behavioral signals improved accuracy, 3) A/B testing at scale was critical for validating hypotheses.",
      "evidence_pack": [
        {"label": "Case Study", "url": "https://example.com/case-study", "type": "other"},
        {"label": "Technical Blog", "url": "https://example.com/blog", "type": "other"}
      ]
    }'::jsonb
  ),
  (
    'developer-platform-redesign',
    'Developer Platform & API Redesign',
    'Led the complete redesign of a developer platform serving 50K+ developers, improving onboarding completion by 60%.',
    ARRAY['API', 'Developer Experience', 'Product'],
    'PUBLIC',
    'FULL',
    true,
    true,
    '[{"id":"snapshot","visible":true,"order":0},{"id":"problem_framing","visible":true,"order":1},{"id":"your_role","visible":true,"order":2},{"id":"approach_decisions","visible":true,"order":3},{"id":"outcome_learnings","visible":true,"order":4}]'::jsonb,
    '{
      "snapshot": {
        "problem": "Developer onboarding was complex with 40% drop-off rate in the first week",
        "role": "Product Manager working with platform engineering team (8 engineers)",
        "approach": "Complete API redesign, interactive documentation, simplified auth flow",
        "outcome": "60% improvement in onboarding completion, NPS increased by 25 points"
      },
      "problem_framing": "Developer surveys and analytics revealed that our API was difficult to understand, authentication was complex, and documentation was outdated. The 40% drop-off rate was directly impacting our revenue growth.",
      "your_role": "I led product discovery, defined the roadmap, and coordinated between engineering, developer relations, and design teams. I also conducted 30+ developer interviews to understand pain points.",
      "approach_decisions": "We prioritized: 1) Simplifying authentication from 5 steps to 2, 2) Creating interactive API playground, 3) Auto-generating documentation from OpenAPI specs, 4) Adding code examples in 6 languages.",
      "outcome_learnings": "Developer experience is product experience. The improvements not only reduced churn but also increased API usage by 80% among retained developers."
    }'::jsonb
  ),
  (
    'startup-mvp-fintech',
    'Fintech Startup MVP',
    'Took a B2B SaaS product from concept to launch in 12 weeks, acquiring first 100 paying customers.',
    ARRAY['Startups', 'Fintech', 'MVP'],
    'CONFIDENTIAL',
    'SUMMARY',
    false,
    true,
    '[{"id":"snapshot","visible":true,"order":0}]'::jsonb,
    '{
      "snapshot": {
        "problem": "SMBs struggled with cash flow management and invoice processing",
        "role": "Co-founder and Product Lead",
        "approach": "Rapid MVP development with weekly customer feedback loops",
        "outcome": "100 paying customers in first 3 months, $150K ARR"
      }
    }'::jsonb
  ),
  (
    'internal-tools-automation',
    'Internal Tools Automation Platform',
    'Designed and built an internal automation platform that saved 2000+ engineering hours annually.',
    ARRAY['Internal Tools', 'Automation', 'Engineering'],
    'PUBLIC',
    'FULL',
    false,
    true,
    '[{"id":"snapshot","visible":true,"order":0},{"id":"problem_framing","visible":true,"order":1},{"id":"outcome_learnings","visible":true,"order":2}]'::jsonb,
    '{
      "snapshot": {
        "problem": "Engineers spent 30% of their time on repetitive operational tasks",
        "role": "Technical Product Manager",
        "approach": "Built low-code automation platform with 50+ pre-built integrations",
        "outcome": "2000+ hours saved annually, 95% user satisfaction"
      },
      "problem_framing": "Engineering surveys revealed that a third of engineering time was spent on repetitive tasks like deployments, data migrations, and report generation. This was impacting morale and delivery speed.",
      "outcome_learnings": "Internal tools often get deprioritized, but the ROI can be massive. User research with internal customers is just as important as external customer research."
    }'::jsonb
  ),
  (
    'mobile-app-concept',
    'AI Writing Assistant Mobile App',
    'Concept for an AI-powered writing assistant focused on professional communication.',
    ARRAY['Mobile', 'AI/LLM', 'Concept'],
    'CONCEPT',
    'MINIMAL',
    false,
    true,
    '[{"id":"snapshot","visible":true,"order":0}]'::jsonb,
    '{
      "snapshot": {
        "problem": "Professionals struggle to write clear, effective emails and messages",
        "role": "Product conceptualization and market research",
        "approach": "LLM-powered suggestions with context awareness and tone adjustment",
        "outcome": "Concept validated with 50+ user interviews, seeking funding"
      }
    }'::jsonb
  )
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  summary = EXCLUDED.summary,
  tags = EXCLUDED.tags,
  status = EXCLUDED.status,
  detail_level = EXCLUDED.detail_level,
  featured = EXCLUDED.featured,
  published = EXCLUDED.published,
  sections_config = EXCLUDED.sections_config,
  content = EXCLUDED.content;

-- ============================================================
-- SETUP INSTRUCTIONS
-- ============================================================
-- 
-- After running this script:
-- 
-- 1. Create a user in Supabase Auth (Authentication > Users > Add User)
-- 
-- 2. Set bootstrap token by running:
--    SELECT public.set_bootstrap_token('your-secret-token-here');
-- 
-- 3. In your app, go to /admin/login, log in with your user
-- 
-- 4. Then go to /admin/setup and enter your bootstrap token
-- 
-- 5. You're now the admin!
-- 
-- ============================================================
