-- submitted and approved YouTube videos
CREATE TABLE public.videos (
  id               uuid                   PRIMARY KEY DEFAULT gen_random_uuid(),
  youtube_id       text                   UNIQUE NOT NULL,
  title            text                   NOT NULL,
  thumbnail_url    text,
  channel_id       uuid                   REFERENCES public.channels(id) ON DELETE SET NULL,
  category         public.video_category  NOT NULL DEFAULT 'other',
  age_band         public.age_band,
  status           public.video_status    NOT NULL DEFAULT 'pending',
  approval_count   integer                NOT NULL DEFAULT 0,
  rejection_count  integer                NOT NULL DEFAULT 0,
  submitted_by     uuid                   REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at       timestamptz            NOT NULL DEFAULT now(),
  updated_at       timestamptz            NOT NULL DEFAULT now()
);

ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER videos_updated_at
  BEFORE UPDATE ON public.videos
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
