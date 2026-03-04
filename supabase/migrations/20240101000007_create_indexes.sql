-- Catalog browse — the most frequent query (status + category + age_band)
CREATE INDEX idx_videos_status_category_age
  ON public.videos (status, category, age_band);

-- Flag trigger COUNT — queried on every flag insert
CREATE INDEX idx_flags_video_status
  ON public.flags (video_id, status);

-- FK indexes (PostgreSQL does not auto-create these)
CREATE INDEX idx_videos_channel_id
  ON public.videos (channel_id);

CREATE INDEX idx_videos_submitted_by
  ON public.videos (submitted_by);

CREATE INDEX idx_reviews_video_id
  ON public.reviews (video_id);

CREATE INDEX idx_reviews_reviewer_id
  ON public.reviews (reviewer_id);

CREATE INDEX idx_flags_video_id
  ON public.flags (video_id);

-- Partial index — skip NULL raised_by rows (anonymous flags)
CREATE INDEX idx_flags_raised_by
  ON public.flags (raised_by)
  WHERE raised_by IS NOT NULL;

-- Partial index — fast moderator lookup
CREATE INDEX idx_reviewers_is_moderator
  ON public.reviewers (id)
  WHERE is_moderator = true;
