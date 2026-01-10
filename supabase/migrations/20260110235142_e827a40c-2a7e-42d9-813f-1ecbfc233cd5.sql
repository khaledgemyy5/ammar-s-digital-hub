-- Fix 1: Create a view for public site settings that excludes sensitive fields
CREATE OR REPLACE VIEW public.public_site_settings AS
SELECT 
  id,
  nav_config,
  home_sections,
  theme,
  seo,
  pages,
  created_at,
  updated_at
FROM public.site_settings;

-- Grant select on the view to anon and authenticated
GRANT SELECT ON public.public_site_settings TO anon, authenticated;

-- Fix 2: Update projects RLS policy to exclude CONFIDENTIAL projects from public access
DROP POLICY IF EXISTS "Public can read published projects" ON public.projects;

CREATE POLICY "Public can read published public projects" 
ON public.projects 
FOR SELECT 
USING (published = true AND status = 'PUBLIC');