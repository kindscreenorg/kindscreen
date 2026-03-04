-- ================================================================
-- KindScreen local dev seed
-- Applies AFTER migrations via `supabase db reset`.
-- Creates test accounts, sample channels, and sample videos.
-- NEVER run against production.
-- ================================================================

-- ----------------------------------------------------------------
-- Auth users
-- Three fixed UUIDs for deterministic local testing.
-- ----------------------------------------------------------------
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  role
) VALUES
  -- admin / moderator account
  (
    '00000000-0000-0000-0000-000000000001',
    'admin@kindscreen.dev',
    crypt('Password123!', gen_salt('bf')),
    now(), now(), now(),
    '{"provider":"email","providers":["email"]}',
    '{"username":"admin_alice"}',
    false,
    'authenticated'
  ),
  -- trusted reviewer
  (
    '00000000-0000-0000-0000-000000000002',
    'trusted@kindscreen.dev',
    crypt('Password123!', gen_salt('bf')),
    now(), now(), now(),
    '{"provider":"email","providers":["email"]}',
    '{"username":"trusted_bob"}',
    false,
    'authenticated'
  ),
  -- regular reviewer
  (
    '00000000-0000-0000-0000-000000000003',
    'reviewer@kindscreen.dev',
    crypt('Password123!', gen_salt('bf')),
    now(), now(), now(),
    '{"provider":"email","providers":["email"]}',
    '{"username":"reviewer_carol"}',
    false,
    'authenticated'
  )
ON CONFLICT (id) DO NOTHING;

-- Auth identities (required for email/password sign-in)
INSERT INTO auth.identities (
  id,
  user_id,
  identity_data,
  provider,
  provider_id,
  last_sign_in_at,
  created_at,
  updated_at
) VALUES
  (
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    '{"sub":"00000000-0000-0000-0000-000000000001","email":"admin@kindscreen.dev"}',
    'email',
    '00000000-0000-0000-0000-000000000001',
    now(), now(), now()
  ),
  (
    '00000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000002',
    '{"sub":"00000000-0000-0000-0000-000000000002","email":"trusted@kindscreen.dev"}',
    'email',
    '00000000-0000-0000-0000-000000000002',
    now(), now(), now()
  ),
  (
    '00000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000003',
    '{"sub":"00000000-0000-0000-0000-000000000003","email":"reviewer@kindscreen.dev"}',
    'email',
    '00000000-0000-0000-0000-000000000003',
    now(), now(), now()
  )
ON CONFLICT (provider, provider_id) DO NOTHING;

-- ----------------------------------------------------------------
-- Reviewer profiles
-- ----------------------------------------------------------------
INSERT INTO public.reviewers (id, username, is_admin, is_moderator, is_trusted, review_count)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'admin_alice',    true,  true,  true, 10),
  ('00000000-0000-0000-0000-000000000002', 'trusted_bob',    false, false, true,  5),
  ('00000000-0000-0000-0000-000000000003', 'reviewer_carol', false, false, false, 2)
ON CONFLICT (id) DO NOTHING;

-- ----------------------------------------------------------------
-- Sample channels
-- ----------------------------------------------------------------
INSERT INTO public.channels (id, youtube_channel_id, name, description, is_whitelisted)
VALUES
  (
    'aaaaaaaa-0000-0000-0000-000000000001',
    'UCbCmjCuTUZos6Inko4u57UQ',
    'Cocomelon - Nursery Rhymes',
    'Educational nursery rhymes and kids songs',
    true
  ),
  (
    'aaaaaaaa-0000-0000-0000-000000000002',
    'UCVTyTA7KZpC4sFCCnrZ7bFw',
    'Science Max | Experiments At Large',
    'Big science experiments for curious kids',
    true
  ),
  (
    'aaaaaaaa-0000-0000-0000-000000000003',
    'UCzWQYUVCpZqtN93H8RR44Qw',
    'Unverified Channel',
    'Not yet whitelisted — pending review',
    false
  )
ON CONFLICT (id) DO NOTHING;

-- ----------------------------------------------------------------
-- Sample videos
-- ----------------------------------------------------------------
INSERT INTO public.videos (
  id, youtube_id, title, thumbnail_url,
  channel_id, category, age_band, status,
  approval_count, rejection_count, submitted_by
) VALUES
  -- Approved video (visible to anon)
  (
    'bbbbbbbb-0000-0000-0000-000000000001',
    'e_04ZrNroTo',
    'Five Little Ducks | Kids Songs',
    'https://img.youtube.com/vi/e_04ZrNroTo/hqdefault.jpg',
    'aaaaaaaa-0000-0000-0000-000000000001',
    'music',
    '3-5',
    'approved',
    3, 0,
    '00000000-0000-0000-0000-000000000003'
  ),
  -- Another approved video
  (
    'bbbbbbbb-0000-0000-0000-000000000002',
    'XqZsoesa55w',
    'Baby Shark Dance | #babyshark',
    'https://img.youtube.com/vi/XqZsoesa55w/hqdefault.jpg',
    'aaaaaaaa-0000-0000-0000-000000000001',
    'music',
    '3-5',
    'approved',
    3, 0,
    '00000000-0000-0000-0000-000000000003'
  ),
  -- Pending video (visible to reviewers only)
  (
    'bbbbbbbb-0000-0000-0000-000000000003',
    'dQw4w9WgXcQ',
    'Science Experiment: Baking Soda Volcano',
    NULL,
    'aaaaaaaa-0000-0000-0000-000000000002',
    'science',
    NULL,
    'pending',
    1, 0,
    '00000000-0000-0000-0000-000000000002'
  )
ON CONFLICT (id) DO NOTHING;
