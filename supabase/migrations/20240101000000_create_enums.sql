-- video lifecycle states
CREATE TYPE public.video_status AS ENUM (
  'pending',
  'approved',
  'rejected'
);

-- content categories for catalog browsing
CREATE TYPE public.video_category AS ENUM (
  'educational',
  'music',
  'stories',
  'science',
  'art',
  'nature',
  'sports',
  'games',
  'other'
);

-- age-appropriate viewing bands
CREATE TYPE public.age_band AS ENUM (
  '3-5',
  '6-9',
  '10-12'
);

-- flag lifecycle states
CREATE TYPE public.flag_status AS ENUM (
  'open',
  'resolved'
);
