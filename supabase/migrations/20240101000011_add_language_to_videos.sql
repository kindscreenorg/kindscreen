CREATE TYPE public.video_language AS ENUM (
  'english', 'portuguese', 'spanish', 'french',
  'german', 'japanese', 'korean', 'other'
);

ALTER TABLE public.videos
  ADD COLUMN language public.video_language NOT NULL DEFAULT 'english';
