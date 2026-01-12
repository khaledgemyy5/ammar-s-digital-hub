-- Add Draft/Published separation to site_settings
-- This enables saving drafts independently from published content

-- Add draft and published JSON columns
ALTER TABLE public.site_settings 
ADD COLUMN IF NOT EXISTS draft_json jsonb DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS published_json jsonb DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS draft_updated_at timestamp with time zone DEFAULT now(),
ADD COLUMN IF NOT EXISTS published_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS published_version integer DEFAULT 0;

-- Initialize draft_json and published_json with current settings
-- This migration copies existing settings to both draft and published
UPDATE public.site_settings 
SET 
  draft_json = jsonb_build_object(
    'nav_config', nav_config,
    'home_sections', home_sections,
    'theme', theme,
    'seo', seo,
    'pages', pages
  ),
  published_json = jsonb_build_object(
    'nav_config', nav_config,
    'home_sections', home_sections,
    'theme', theme,
    'seo', seo,
    'pages', pages
  ),
  draft_updated_at = now(),
  published_at = now(),
  published_version = 1
WHERE draft_json = '{}'::jsonb OR published_json = '{}'::jsonb;

-- Create a function to publish draft settings
CREATE OR REPLACE FUNCTION public.publish_site_settings()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  settings_row site_settings%ROWTYPE;
  new_version integer;
BEGIN
  -- Check if user is admin
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Only admins can publish settings';
  END IF;
  
  -- Get current settings
  SELECT * INTO settings_row FROM site_settings LIMIT 1;
  
  IF settings_row IS NULL THEN
    RAISE EXCEPTION 'No settings found';
  END IF;
  
  -- Calculate new version
  new_version := COALESCE(settings_row.published_version, 0) + 1;
  
  -- Copy draft to published
  UPDATE site_settings 
  SET 
    published_json = draft_json,
    published_at = now(),
    published_version = new_version,
    -- Also update the legacy columns for backward compatibility
    nav_config = COALESCE(draft_json->'nav_config', nav_config),
    home_sections = COALESCE(draft_json->'home_sections', home_sections),
    theme = COALESCE(draft_json->'theme', theme),
    seo = COALESCE(draft_json->'seo', seo),
    pages = COALESCE(draft_json->'pages', pages),
    updated_at = now()
  WHERE id = settings_row.id;
  
  RETURN jsonb_build_object(
    'success', true,
    'version', new_version,
    'published_at', now()
  );
END;
$$;

-- Create a function to save draft settings
CREATE OR REPLACE FUNCTION public.save_draft_settings(draft_data jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  settings_row site_settings%ROWTYPE;
BEGIN
  -- Check if user is admin
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Only admins can save draft settings';
  END IF;
  
  -- Get current settings
  SELECT * INTO settings_row FROM site_settings LIMIT 1;
  
  IF settings_row IS NULL THEN
    RAISE EXCEPTION 'No settings found';
  END IF;
  
  -- Merge the draft_data with existing draft_json
  UPDATE site_settings 
  SET 
    draft_json = settings_row.draft_json || draft_data,
    draft_updated_at = now()
  WHERE id = settings_row.id;
  
  RETURN jsonb_build_object(
    'success', true,
    'draft_updated_at', now()
  );
END;
$$;

-- Update the public_site_settings view to use published_json
DROP VIEW IF EXISTS public.public_site_settings;
CREATE VIEW public.public_site_settings AS
SELECT 
  id,
  COALESCE(published_json->'nav_config', nav_config) as nav_config,
  COALESCE(published_json->'home_sections', home_sections) as home_sections,
  COALESCE(published_json->'theme', theme) as theme,
  COALESCE(published_json->'seo', seo) as seo,
  COALESCE(published_json->'pages', pages) as pages,
  published_version,
  published_at,
  created_at,
  updated_at
FROM site_settings;

-- Grant access to the view
GRANT SELECT ON public.public_site_settings TO anon, authenticated;

-- Grant execute on the new functions to authenticated users
GRANT EXECUTE ON FUNCTION public.publish_site_settings() TO authenticated;
GRANT EXECUTE ON FUNCTION public.save_draft_settings(jsonb) TO authenticated;