-- Fix: Restrict public access to site_settings base table
-- Public access will only be through the secure public_site_settings view

-- Drop the overly permissive public SELECT policy
DROP POLICY IF EXISTS "Public can read site settings" ON public.site_settings;

-- Create a new policy that only allows admins to SELECT from the base table
-- Public users should use the public_site_settings view instead
CREATE POLICY "Only admins can read base site settings" ON public.site_settings
  FOR SELECT 
  USING (is_admin());

-- Grant SELECT on the public_site_settings view to anon and authenticated roles
-- This is the proper way for public access to site settings (excludes sensitive fields)
GRANT SELECT ON public.public_site_settings TO anon, authenticated;