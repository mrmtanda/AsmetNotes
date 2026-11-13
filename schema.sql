-- ====================================================================
-- Supabase Database Schema: Simple Notes / Asmet Notes
-- Project ID: gudoctpbbejzytbpldiv
-- Engine: PostgreSQL 17 (Supabase)
-- Security & Performance: Fully RLS Enabled, Subquery Optimized, Search Path Hardened
-- ====================================================================

-- --------------------------------------------------------------------
-- 1. UTILITY FUNCTIONS & TRIGGERS
-- --------------------------------------------------------------------

-- Automatically updates 'updated_at' timestamp on record modification
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = clock_timestamp();
    RETURN NEW;
END;
$$;

-- Restrict trigger execution from direct public API / RPC calls
REVOKE EXECUTE ON FUNCTION public.handle_updated_at() FROM PUBLIC, anon, authenticated;


-- --------------------------------------------------------------------
-- 2. USER PROFILES TABLE (Workspace settings & preferences)
-- --------------------------------------------------------------------
-- Maps 1-to-1 with auth.users to store theme, view layout, and default preferences

CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    workspace_name TEXT NOT NULL DEFAULT 'Asmet Workspace',
    theme TEXT NOT NULL DEFAULT 'system' CHECK (theme IN ('system', 'light', 'dark')),
    default_sort TEXT NOT NULL DEFAULT 'newest' CHECK (default_sort IN ('newest', 'oldest', 'title')),
    view_mode TEXT NOT NULL DEFAULT 'grid' CHECK (view_mode IN ('grid', 'list')),
    default_tag TEXT NOT NULL DEFAULT 'Personal',
    default_color TEXT NOT NULL DEFAULT 'indigo',
    created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);

-- Trigger to maintain updated_at on profiles
CREATE OR REPLACE TRIGGER set_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


-- --------------------------------------------------------------------
-- 3. TAGS TABLE (User-defined tags / categories)
-- --------------------------------------------------------------------
-- Supports custom tags, colors, and organization per user

CREATE TABLE IF NOT EXISTS public.tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    color TEXT NOT NULL DEFAULT 'indigo',
    created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    CONSTRAINT unique_user_tag_name UNIQUE (user_id, name)
);

CREATE INDEX IF NOT EXISTS idx_tags_user_id ON public.tags(user_id);


-- --------------------------------------------------------------------
-- 4. NOTES TABLE (Core notes data model)
-- --------------------------------------------------------------------
-- Stores note titles, markdown/plain content, pinning status, soft delete/archive,
-- and generated full-text search (FTS) tsvectors.

CREATE TABLE IF NOT EXISTS public.notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL DEFAULT '',
    tag TEXT NOT NULL DEFAULT 'Personal',
    color TEXT NOT NULL DEFAULT 'indigo',
    pinned BOOLEAN NOT NULL DEFAULT FALSE,
    is_archived BOOLEAN NOT NULL DEFAULT FALSE,
    is_trashed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    -- Generated full-text search column across title, content, and tag
    fts tsvector GENERATED ALWAYS AS (
        to_tsvector('english', coalesce(title, '') || ' ' || coalesce(content, '') || ' ' || coalesce(tag, ''))
    ) STORED
);

-- Query optimization indexes
-- Primary feed index: filter by user, sorted by pinned first, then created date
CREATE INDEX IF NOT EXISTS idx_notes_user_list ON public.notes(user_id, pinned DESC, created_at DESC);
-- Recent edits filter index
CREATE INDEX IF NOT EXISTS idx_notes_user_updated ON public.notes(user_id, updated_at DESC);
-- Tag filtering index
CREATE INDEX IF NOT EXISTS idx_notes_user_tag ON public.notes(user_id, tag);
-- High-speed full-text search index
CREATE INDEX IF NOT EXISTS idx_notes_fts ON public.notes USING GIN(fts);

-- Trigger to maintain updated_at on notes
CREATE OR REPLACE TRIGGER set_notes_updated_at
BEFORE UPDATE ON public.notes
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


-- --------------------------------------------------------------------
-- 5. NOTE_TAGS JUNCTION TABLE (Many-to-Many tagging)
-- --------------------------------------------------------------------
-- Allows notes to be associated with multiple custom tags

CREATE TABLE IF NOT EXISTS public.note_tags (
    note_id UUID NOT NULL REFERENCES public.notes(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    PRIMARY KEY (note_id, tag_id)
);

CREATE INDEX IF NOT EXISTS idx_note_tags_tag_id ON public.note_tags(tag_id);


-- --------------------------------------------------------------------
-- 6. AUTOMATED USER ONBOARDING & INSTANT ACTIVATION (Auth Hooks)
-- --------------------------------------------------------------------
-- 6.1 Automatically confirms user emails on registration so they can sign in immediately
CREATE OR REPLACE FUNCTION public.auto_confirm_user()
RETURNS TRIGGER AS $$
BEGIN
    NEW.email_confirmed_at = clock_timestamp();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE EXECUTE ON FUNCTION public.auto_confirm_user() FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE TRIGGER on_auth_user_before_insert
BEFORE INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.auto_confirm_user();

-- 6.2 When a user registers in Supabase Auth, automatically creates:
-- 1) Their default profile
-- 2) Starter tags ('Work', 'Personal', 'Ideas', 'Todo')

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Provision profile
    INSERT INTO public.profiles (id, workspace_name)
    VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', 'Asmet Workspace') || '''s Workspace')
    ON CONFLICT (id) DO NOTHING;

    -- Seed starter tags
    INSERT INTO public.tags (user_id, name, color)
    VALUES
        (NEW.id, 'Work', 'emerald'),
        (NEW.id, 'Personal', 'indigo'),
        (NEW.id, 'Ideas', 'amber'),
        (NEW.id, 'Todo', 'rose')
    ON CONFLICT DO NOTHING;

    RETURN NEW;
END;
$$;

-- Restrict execution from public API
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

-- Trigger fired after an auth user is created
CREATE OR REPLACE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- --------------------------------------------------------------------
-- 7. SEARCH RPC FUNCTION (Full-Text Search with Fallback)
-- --------------------------------------------------------------------
-- Invoked securely by authenticated clients to perform natural language search

CREATE OR REPLACE FUNCTION public.search_notes(search_term TEXT)
RETURNS SETOF public.notes 
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT *
    FROM public.notes
    WHERE (
        search_term = ''
        OR fts @@ websearch_to_tsquery('english', search_term)
        OR title ILIKE '%' || search_term || '%'
        OR content ILIKE '%' || search_term || '%'
    )
    ORDER BY pinned DESC, created_at DESC;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.search_notes(TEXT) FROM anon;
GRANT EXECUTE ON FUNCTION public.search_notes(TEXT) TO authenticated;


-- --------------------------------------------------------------------
-- 8. ROW LEVEL SECURITY (RLS) POLICIES
-- --------------------------------------------------------------------
-- Complete Zero-Trust security model.
-- Uses `(select auth.uid())` subquery wrapper to ensure optimal single-eval
-- initplan performance at scale without row-by-row re-evaluation overhead.

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.note_tags ENABLE ROW LEVEL SECURITY;

-- 8.1 PROFILES POLICIES
CREATE POLICY "Users can view their own profile"
    ON public.profiles FOR SELECT
    TO authenticated
    USING ((select auth.uid()) = id);

CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE
    TO authenticated
    USING ((select auth.uid()) = id)
    WITH CHECK ((select auth.uid()) = id);

CREATE POLICY "Users can insert their own profile"
    ON public.profiles FOR INSERT
    TO authenticated
    WITH CHECK ((select auth.uid()) = id);

-- 8.2 TAGS POLICIES
CREATE POLICY "Users can view their own tags"
    ON public.tags FOR SELECT
    TO authenticated
    USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can create their own tags"
    ON public.tags FOR INSERT
    TO authenticated
    WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update their own tags"
    ON public.tags FOR UPDATE
    TO authenticated
    USING ((select auth.uid()) = user_id)
    WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete their own tags"
    ON public.tags FOR DELETE
    TO authenticated
    USING ((select auth.uid()) = user_id);

-- 8.3 NOTES POLICIES
CREATE POLICY "Users can view their own notes"
    ON public.notes FOR SELECT
    TO authenticated
    USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert their own notes"
    ON public.notes FOR INSERT
    TO authenticated
    WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update their own notes"
    ON public.notes FOR UPDATE
    TO authenticated
    USING ((select auth.uid()) = user_id)
    WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete their own notes"
    ON public.notes FOR DELETE
    TO authenticated
    USING ((select auth.uid()) = user_id);

-- 8.4 NOTE_TAGS JUNCTION POLICIES
CREATE POLICY "Users can view their own note tags"
    ON public.note_tags FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.notes
            WHERE notes.id = note_tags.note_id AND notes.user_id = (select auth.uid())
        )
    );

CREATE POLICY "Users can insert their own note tags"
    ON public.note_tags FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.notes
            WHERE notes.id = note_tags.note_id AND notes.user_id = (select auth.uid())
        )
    );

CREATE POLICY "Users can update their own note tags"
    ON public.note_tags FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.notes
            WHERE notes.id = note_tags.note_id AND notes.user_id = (select auth.uid())
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.notes
            WHERE notes.id = note_tags.note_id AND notes.user_id = (select auth.uid())
        )
    );

CREATE POLICY "Users can delete their own note tags"
    ON public.note_tags FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.notes
            WHERE notes.id = note_tags.note_id AND notes.user_id = (select auth.uid())
        )
    );


-- --------------------------------------------------------------------
-- 9. SUPABASE REALTIME REPLICATION
-- --------------------------------------------------------------------
-- Enables live sync across multiple open browser tabs or devices

DO $$
BEGIN
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.notes;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.tags;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
END $$;
