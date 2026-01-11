-- Add CHECK constraint on event field to validate event types
ALTER TABLE public.analytics_events 
ADD CONSTRAINT analytics_events_event_check 
CHECK (event IN ('page_view', 'resume_download', 'contact_click', 'writing_click', 'project_view'));

-- Add CHECK constraint on path field to ensure valid paths
ALTER TABLE public.analytics_events 
ADD CONSTRAINT analytics_events_path_check 
CHECK (path IS NULL OR path ~ '^/');

-- Add CHECK constraint on sid to ensure it's a valid UUID format
ALTER TABLE public.analytics_events 
ADD CONSTRAINT analytics_events_sid_check 
CHECK (sid ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$');