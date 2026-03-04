-- content flags raised by any visitor (anon allowed — raised_by nullable)
CREATE TABLE public.flags (
  id          uuid             PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id    uuid             NOT NULL REFERENCES public.videos(id) ON DELETE CASCADE,
  raised_by   uuid             REFERENCES auth.users(id) ON DELETE SET NULL,
  reason      text             NOT NULL,
  status      public.flag_status NOT NULL DEFAULT 'open',
  resolved_by uuid             REFERENCES public.reviewers(id) ON DELETE SET NULL,
  created_at  timestamptz      NOT NULL DEFAULT now(),
  updated_at  timestamptz      NOT NULL DEFAULT now()
);

ALTER TABLE public.flags ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER flags_updated_at
  BEFORE UPDATE ON public.flags
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
