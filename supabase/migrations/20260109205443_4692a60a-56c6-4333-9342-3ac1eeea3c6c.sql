-- Add published_at column to writing_items
ALTER TABLE public.writing_items 
ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ NULL;

-- Create index for sorting by published_at
CREATE INDEX IF NOT EXISTS idx_writing_items_published_at 
ON public.writing_items(published_at DESC NULLS LAST);