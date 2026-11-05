-- Migration 001: Initial Schema for The SIP Locker
-- Region: ap-south-1 (Mumbai)

-- 1. Create Tables
CREATE TABLE IF NOT EXISTS public.sips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    dedication TEXT,
    fund_label TEXT NOT NULL,
    amount NUMERIC(12, 2) NOT NULL,
    day_of_month INTEGER NOT NULL,
    start_date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'stopped')),
    pause_until DATE,
    return_date DATE,
    return_label TEXT,
    promise_text TEXT,
    promise_one_line TEXT,
    promise_goal TEXT,
    promise_for_whom TEXT,
    promise_horizon TEXT,
    promise_audio_path TEXT,
    show_promise_at_cancel BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.instalments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sip_id UUID NOT NULL REFERENCES public.sips(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    due_date DATE NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('paid', 'failed', 'skipped', 'paused', 'processing')),
    amount NUMERIC(12, 2) NOT NULL,
    nav NUMERIC(10, 4),
    units NUMERIC(12, 4),
    failure_code TEXT,
    failure_text TEXT,
    note TEXT,
    slip_text TEXT,
    slip_gate TEXT,
    story_text TEXT,
    story_gate TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.memories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    instalment_id UUID NOT NULL REFERENCES public.instalments(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    kind TEXT NOT NULL CHECK (kind IN ('photo', 'voice', 'text')),
    storage_path TEXT,
    text TEXT,
    transcript TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sip_id UUID NOT NULL REFERENCES public.sips(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    kind TEXT NOT NULL CHECK (kind IN ('year_two')),
    text TEXT,
    audio_path TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.gate_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    route TEXT NOT NULL,
    result TEXT NOT NULL,
    latency_ms INTEGER NOT NULL,
    input_tokens INTEGER NOT NULL DEFAULT 0,
    output_tokens INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Row Level Security (RLS)
ALTER TABLE public.sips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.instalments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gate_log ENABLE ROW LEVEL SECURITY;

-- Policies for sips
CREATE POLICY "Users can manage their own sips"
    ON public.sips FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Policies for instalments
CREATE POLICY "Users can manage their own instalments"
    ON public.instalments FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Policies for memories
CREATE POLICY "Users can manage their own memories"
    ON public.memories FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Policies for notes
CREATE POLICY "Users can manage their own notes"
    ON public.notes FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Gate log policy: insertable by service role, readable by authenticated users
CREATE POLICY "Insert gate log from backend"
    ON public.gate_log FOR INSERT
    WITH CHECK (true);

-- 3. Storage Bucket: memories
INSERT INTO storage.buckets (id, name, public)
VALUES ('memories', 'memories', false)
ON CONFLICT (id) DO NOTHING;

-- Storage Policy: Users can only upload and read files in their own folder
CREATE POLICY "Users can manage own memory files"
    ON storage.objects FOR ALL
    USING (bucket_id = 'memories' AND auth.uid()::text = (storage.foldername(name))[1])
    WITH CHECK (bucket_id = 'memories' AND auth.uid()::text = (storage.foldername(name))[1]);
