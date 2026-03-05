-- ================================================================
-- KindScreen production bootstrap — creates the first admin user.
-- Run once via the Supabase SQL editor after deploying migrations.
--
-- BEFORE RUNNING: change the three variables below.
-- ================================================================

DO $$
DECLARE
  admin_email    text := 'CHANGE_ME@example.com';
  admin_password text := 'CHANGE_ME_strong_password';
  admin_username text := 'CHANGE_ME_username';

  admin_id uuid := gen_random_uuid();
BEGIN
  -- 1. Auth user
  INSERT INTO auth.users (
    instance_id, id, aud, role,
    email, encrypted_password,
    email_confirmed_at, created_at, updated_at,
    raw_app_meta_data, raw_user_meta_data,
    is_super_admin, is_sso_user, is_anonymous,
    confirmation_token, recovery_token,
    email_change_token_new, email_change_token_current,
    email_change, phone_change
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    admin_id, 'authenticated', 'authenticated',
    admin_email, crypt(admin_password, gen_salt('bf')),
    now(), now(), now(),
    '{"provider":"email","providers":["email"]}',
    jsonb_build_object(
      'sub', admin_id,
      'email', admin_email,
      'email_verified', true,
      'phone_verified', false,
      'username', admin_username
    ),
    false, false, false,
    '', '', '', '', '', ''
  );

  -- 2. Auth identity (required for email/password sign-in)
  INSERT INTO auth.identities (
    id, user_id, identity_data, provider, provider_id,
    last_sign_in_at, created_at, updated_at
  ) VALUES (
    admin_id, admin_id,
    jsonb_build_object(
      'sub', admin_id,
      'email', admin_email,
      'email_verified', true,
      'phone_verified', false
    ),
    'email', admin_id,
    now(), now(), now()
  );

  -- 3. Promote to admin (the on_auth_user_created trigger already created
  --    the reviewers row with username from raw_user_meta_data)
  UPDATE public.reviewers
  SET is_admin = true, is_moderator = true
  WHERE id = admin_id;
END $$;
