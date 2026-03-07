CREATE INDEX idx_videos_title_fts
  ON public.videos
  USING GIN (to_tsvector('english', title));
