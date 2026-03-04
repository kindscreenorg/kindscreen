-- whitelisted YouTube channels
CREATE TABLE public.channels (
  id                 uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  youtube_channel_id text        UNIQUE NOT NULL,
  name               text        NOT NULL,
  description        text,
  thumbnail_url      text,
  is_whitelisted     boolean     NOT NULL DEFAULT false,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.channels ENABLE ROW LEVEL SECURITY;

-- shared updated_at trigger function (reused by all tables)
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER channels_updated_at
  BEFORE UPDATE ON public.channels
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
