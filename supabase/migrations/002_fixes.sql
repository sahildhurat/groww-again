-- Migration 002: Fixes, Bucket Limits, and Consents Table
-- Region: ap-south-1 (Mumbai)

-- 1. Set the default of sips.show_promise_at_cancel to false
ALTER TABLE public.sips ALTER COLUMN show_promise_at_cancel SET DEFAULT false;

-- 2. Drop policy "Insert gate log from backend" (service role key bypasses RLS)
DROP POLICY IF EXISTS "Insert gate log from backend" ON public.gate_log;

-- 3. Set the memories bucket to 5 MB file size limit and allowed MIME types only
UPDATE storage.buckets
SET file_size_limit = 5242880,
    allowed_mime_types = ARRAY['image/jpeg', 'audio/webm', 'audio/mp4', 'audio/mpeg', 'audio/wav']
WHERE id = 'memories';

-- 4. Add table consents (id, user_id, version text, accepted_at timestamptz)
CREATE TABLE IF NOT EXISTS public.consents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    version TEXT NOT NULL,
    accepted_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.consents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own consents"
    ON public.consents FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

