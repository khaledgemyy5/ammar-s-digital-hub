-- ============================================================
-- Ammar Resume - Full Database Schema
-- Run this script in Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE project_status AS ENUM ('PUBLIC', 'CONFIDENTIAL', 'CONCEPT');
CREATE TYPE detail_level AS ENUM ('FULL', 'SUMMARY', 'MINIMAL');
CREATE TYPE language_type AS ENUM ('AUTO', 'AR', 'EN');

-- ============================================================
-- TABLES
-- ============================================================

-- Site Settings (singleton)
CREATE TABLE public.site_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nav_config JSONB NOT NULL DEFAULT '[]',
  home_sections JSONB NOT NULL DEFAULT '[]',
  theme JSONB NOT NULL DEFAULT '{"accentColor": "#135BEC", "defaultMode": "light", "font": "ibm-plex"}',
  seo JSONB NOT NULL DEFAULT '{"siteTitle": "Ammar Jaber", "siteDescription": "Technical Product Manager"}',
  pages JSONB NOT NULL DEFAULT '{"resume": {"enabled": true}, "contact": {"enabled": true}}',
  admin_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  bootstrap_token_hash TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Projects
CREATE TABLE public.projects (
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
CREATE TABLE public.writing_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  enabled BOOLEAN DEFAULT TRUE,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Writing Items
CREATE TABLE public.writing_items (
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

-- Analytics Events
CREATE TABLE public.analytics_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event TEXT NOT NULL,
  path TEXT,
  ref TEXT,
  sid TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

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

-- Bootstrap set admin (first-time setup)
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
  
  IF settings_row.admin_user_id IS NOT NULL THEN
    RETURN FALSE;
  END IF;
  
  IF settings_row.bootstrap_token_hash IS NULL OR 
     settings_row.bootstrap_token_hash != crypt(token, settings_row.bootstrap_token_hash) THEN
    RETURN FALSE;
  END IF;
  
  UPDATE site_settings 
  SET admin_user_id = auth.uid(), 
      bootstrap_token_hash = NULL,
      updated_at = NOW()
  WHERE id = settings_row.id;
  
  RETURN TRUE;
END;
$$;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.writing_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.writing_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

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
-- SEED DATA
-- ============================================================

INSERT INTO public.site_settings (nav_config, home_sections) VALUES (
  '[{"id":"home","label":"Home","path":"/","visible":true,"order":0},{"id":"projects","label":"Projects","path":"/projects","visible":true,"order":1},{"id":"writing","label":"Writing","path":"/writing","visible":true,"order":2},{"id":"contact","label":"Contact","path":"/contact","visible":true,"order":3}]',
  '[{"id":"hero","visible":true,"order":0},{"id":"experience_snapshot","visible":true,"order":1},{"id":"featured_projects","visible":true,"order":2,"limit":3},{"id":"how_i_work","visible":true,"order":3},{"id":"selected_writing_preview","visible":true,"order":4,"limit":3},{"id":"contact_cta","visible":true,"order":5}]'
);
