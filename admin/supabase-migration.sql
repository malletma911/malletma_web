-- =============================================================
-- Phase 1.1: Supabase Schema Extension for Radevent-Dashboard
-- Run this in the Supabase Dashboard SQL Editor
-- =============================================================

-- 1) Add new columns to events table
ALTER TABLE events
  ADD COLUMN IF NOT EXISTS slug              text UNIQUE,
  ADD COLUMN IF NOT EXISTS route_polyline    jsonb,
  ADD COLUMN IF NOT EXISTS elevation_profile jsonb,
  ADD COLUMN IF NOT EXISTS color             text,
  ADD COLUMN IF NOT EXISTS short_name        text,
  ADD COLUMN IF NOT EXISTS city              text,
  ADD COLUMN IF NOT EXISTS bike_type         text DEFAULT 'road',
  ADD COLUMN IF NOT EXISTS participation     text DEFAULT 'planned',
  ADD COLUMN IF NOT EXISTS start_time        text,
  ADD COLUMN IF NOT EXISTS gradient_class    text,
  ADD COLUMN IF NOT EXISTS event_info_url    text,
  ADD COLUMN IF NOT EXISTS route_source_url  text,
  ADD COLUMN IF NOT EXISTS source_url        text,
  ADD COLUMN IF NOT EXISTS last_scanned_at   timestamptz,
  ADD COLUMN IF NOT EXISTS min_elevation_m   numeric,
  ADD COLUMN IF NOT EXISTS max_elevation_m   numeric,
  ADD COLUMN IF NOT EXISTS updated_at        timestamptz DEFAULT now();

-- 2) Create agent_scan_log table (audit trail)
CREATE TABLE IF NOT EXISTS agent_scan_log (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id      uuid REFERENCES events(id) ON DELETE CASCADE,
  scan_type     text NOT NULL CHECK (scan_type IN ('initial', 'rescan', 'manual')),
  input_urls    jsonb,
  result        jsonb,
  diff_summary  text,
  applied       boolean DEFAULT false,
  created_at    timestamptz DEFAULT now()
);

-- 3) Auto-update updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_updated_at ON events;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON events
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- 4) RLS for agent_scan_log (service role only)
ALTER TABLE agent_scan_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on agent_scan_log"
  ON agent_scan_log
  FOR ALL
  USING (true)
  WITH CHECK (true);
