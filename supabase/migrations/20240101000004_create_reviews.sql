-- immutable review records — no updated_at (reviews are append-only)
CREATE TABLE public.reviews (
  id                  uuid            PRIMARY KEY DEFAULT gen_random_uuid(),
  reviewer_id         uuid            NOT NULL REFERENCES public.reviewers(id) ON DELETE CASCADE,
  video_id            uuid            NOT NULL REFERENCES public.videos(id) ON DELETE CASCADE,
  has_violence        boolean         NOT NULL DEFAULT false,
  has_scary           boolean         NOT NULL DEFAULT false,
  has_adult_themes    boolean         NOT NULL DEFAULT false,
  has_bad_language    boolean         NOT NULL DEFAULT false,
  age_band_suggestion public.age_band,
  verdict             text            NOT NULL CHECK (verdict IN ('approve', 'reject')),
  rejection_reason    text,
  created_at          timestamptz     NOT NULL DEFAULT now(),

  -- one reviewer, one vote per video
  CONSTRAINT reviews_reviewer_video_unique UNIQUE (reviewer_id, video_id)
);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
