-- Migration 003: Life Markers table for SPEC-07 §7
CREATE TABLE IF NOT EXISTS life_markers (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sip_id       uuid,
  month        text        NOT NULL,
  kind         text        NOT NULL CHECK (kind IN ('photo', 'voice', 'text')),
  caption      text,
  storage_path text,
  created_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE life_markers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "life_markers_owner_only"
  ON life_markers
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

