-- Create wiki_items table for storing actor and knowledge base entries
CREATE TABLE IF NOT EXISTS public.wiki_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    category TEXT NOT NULL DEFAULT 'wiki',
    subcategory TEXT NOT NULL CHECK (subcategory IN ('person', 'organization', 'location', 'event', 'concept')),
    name TEXT NOT NULL,
    description TEXT,
    relevance_score INTEGER NOT NULL DEFAULT 50 CHECK (relevance_score >= 0 AND relevance_score <= 100),
    metadata JSONB DEFAULT '{}',
    tags TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_wiki_items_user_id ON public.wiki_items(user_id);
CREATE INDEX IF NOT EXISTS idx_wiki_items_subcategory ON public.wiki_items(subcategory);
CREATE INDEX IF NOT EXISTS idx_wiki_items_name ON public.wiki_items(name);
CREATE INDEX IF NOT EXISTS idx_wiki_items_tags ON public.wiki_items USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_wiki_items_metadata ON public.wiki_items USING GIN(metadata);

-- Enable Row Level Security
ALTER TABLE public.wiki_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Users can view their own wiki items
CREATE POLICY "Users can view own wiki items"
ON public.wiki_items
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own wiki items
CREATE POLICY "Users can insert own wiki items"
ON public.wiki_items
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own wiki items
CREATE POLICY "Users can update own wiki items"
ON public.wiki_items
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own wiki items
CREATE POLICY "Users can delete own wiki items"
ON public.wiki_items
FOR DELETE
USING (auth.uid() = user_id);

-- Admins can view all wiki items
CREATE POLICY "Admins can view all wiki items"
ON public.wiki_items
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid()
        AND role = 'admin'
    )
);

-- Admins can update all wiki items
CREATE POLICY "Admins can update all wiki items"
ON public.wiki_items
FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid()
        AND role = 'admin'
    )
);

-- Admins can delete all wiki items
CREATE POLICY "Admins can delete all wiki items"
ON public.wiki_items
FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid()
        AND role = 'admin'
    )
);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_wiki_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER trigger_update_wiki_items_updated_at
    BEFORE UPDATE ON public.wiki_items
    FOR EACH ROW
    EXECUTE FUNCTION update_wiki_items_updated_at();
