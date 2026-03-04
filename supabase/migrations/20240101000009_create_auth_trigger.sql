-- Migration: Create auth trigger and username availability RPC
-- Runs after Phase 2 schema. Adds:
--   1. handle_new_user() trigger — auto-creates reviewers row on signup
--   2. reviewers_username_lower unique index — prevents case-insensitive collisions
--   3. username_available() RPC — safe boolean check, avoids exposing reviewer flags

-- ─── 1. Trigger function ──────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_username text;
BEGIN
  v_username := lower(COALESCE(
    NULLIF(TRIM(NEW.raw_user_meta_data->>'username'), ''),
    split_part(NEW.email, '@', 1)
  ));

  INSERT INTO public.reviewers (id, username)
  VALUES (NEW.id, v_username)
  ON CONFLICT (id) DO NOTHING;  -- idempotent guard against event replays

  RETURN NEW;
END;
$$;

-- ─── 2. Attach trigger to auth.users ─────────────────────────────────────────

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ─── 3. Case-insensitive unique index on username ─────────────────────────────
-- Prevents "Alice" and "alice" from coexisting.
-- A collision causes the auth.users INSERT to roll back, so signUp() returns
-- an error that the client maps to "Username already taken."

CREATE UNIQUE INDEX IF NOT EXISTS reviewers_username_lower
  ON public.reviewers (lower(username));

-- ─── 4. Username availability RPC ────────────────────────────────────────────
-- Returns a boolean instead of rows to avoid exposing is_moderator/is_admin
-- flags that a broad SELECT RLS policy would leak to anonymous callers.

CREATE OR REPLACE FUNCTION public.username_available(p_username text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT NOT EXISTS (
    SELECT 1 FROM public.reviewers WHERE lower(username) = lower(p_username)
  );
$$;
