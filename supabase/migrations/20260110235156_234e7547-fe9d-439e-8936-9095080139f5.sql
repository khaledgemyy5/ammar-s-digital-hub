-- Fix security definer view by explicitly setting SECURITY INVOKER
DROP VIEW IF EXISTS public.public_site_settings;

CREATE VIEW public.public_site_settings 
WITH (security_invoker = true) AS
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