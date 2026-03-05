-- ================================================================
-- RLS helper functions
-- SECURITY DEFINER so they can read the reviewers table without
-- triggering RLS recursion from within policy expressions.
-- ================================================================

CREATE OR REPLACE FUNCTION public.is_moderator()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.reviewers
    WHERE id = auth.uid()
      AND (is_moderator = true OR is_admin = true)
  );
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.reviewers
    WHERE id = auth.uid()
      AND is_admin = true
  );
$$;

CREATE OR REPLACE FUNCTION public.is_reviewer()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.reviewers
    WHERE id = auth.uid()
  );
$$;


-- ================================================================
-- channels
-- anon + authenticated: SELECT whitelisted only
-- moderator: ALL
-- ================================================================

CREATE POLICY channels_select_whitelisted
  ON public.channels
  FOR SELECT
  USING (is_whitelisted = true);

CREATE POLICY channels_all_moderator
  ON public.channels
  FOR ALL
  USING (public.is_moderator())
  WITH CHECK (public.is_moderator());


-- ================================================================
-- videos
-- anon: SELECT approved only
-- reviewer: SELECT all + INSERT own submissions
-- moderator: ALL
-- ================================================================

CREATE POLICY videos_select_approved
  ON public.videos
  FOR SELECT
  USING (status = 'approved');

-- Reviewers need to see all statuses to work the review queue
CREATE POLICY videos_select_reviewer
  ON public.videos
  FOR SELECT
  USING (public.is_reviewer());

-- submitted_by must be set to the authenticated user's own uid
CREATE POLICY videos_insert_reviewer
  ON public.videos
  FOR INSERT
  WITH CHECK (
    public.is_reviewer()
    AND submitted_by = auth.uid()
  );

CREATE POLICY videos_all_moderator
  ON public.videos
  FOR ALL
  USING (public.is_moderator())
  WITH CHECK (public.is_moderator());


-- ================================================================
-- reviewers
-- No INSERT policy — rows are created by the auth signup trigger
--   (Phase 3, SECURITY DEFINER) to prevent direct self-insertion.
-- reviewer: SELECT/UPDATE own row (no role elevation)
-- moderator: SELECT all + UPDATE (cannot grant moderator/admin)
-- ================================================================

CREATE POLICY reviewers_select_own
  ON public.reviewers
  FOR SELECT
  USING (id = auth.uid());

-- Prevent a reviewer from elevating their own privileges
CREATE POLICY reviewers_update_own
  ON public.reviewers
  FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (
    id = auth.uid()
    AND is_moderator = (SELECT r.is_moderator FROM public.reviewers r WHERE r.id = auth.uid())
    AND is_admin     = (SELECT r.is_admin     FROM public.reviewers r WHERE r.id = auth.uid())
    AND is_trusted   = (SELECT r.is_trusted   FROM public.reviewers r WHERE r.id = auth.uid())
  );

CREATE POLICY reviewers_select_moderator
  ON public.reviewers
  FOR SELECT
  USING (public.is_moderator());

-- Moderators can update reviewer fields (e.g. trusted status) but
-- only admins can grant is_moderator or is_admin
CREATE POLICY reviewers_update_moderator
  ON public.reviewers
  FOR UPDATE
  USING (public.is_moderator())
  WITH CHECK (
    public.is_moderator()
    AND (
      -- Admins have no restrictions
      public.is_admin()
      OR (
        -- Non-admin moderators cannot change role flags
        is_moderator = (SELECT r.is_moderator FROM public.reviewers r WHERE r.id = reviewers.id)
        AND is_admin = (SELECT r.is_admin     FROM public.reviewers r WHERE r.id = reviewers.id)
      )
    )
  );


-- ================================================================
-- reviews
-- No SELECT for anon (blind review — reviewers only see their own)
-- reviewer: INSERT (not own video) + SELECT own
-- moderator: SELECT all + DELETE
-- ================================================================

CREATE POLICY reviews_insert_own
  ON public.reviews
  FOR INSERT
  WITH CHECK (
    public.is_reviewer()
    AND reviewer_id = auth.uid()
  );

CREATE POLICY reviews_select_own
  ON public.reviews
  FOR SELECT
  USING (reviewer_id = auth.uid());

CREATE POLICY reviews_select_moderator
  ON public.reviews
  FOR SELECT
  USING (public.is_moderator());

CREATE POLICY reviews_delete_moderator
  ON public.reviews
  FOR DELETE
  USING (public.is_moderator());


-- ================================================================
-- flags
-- anon + authenticated: INSERT only
--   raised_by must be NULL (anon) or the caller's own uid
-- moderator: SELECT all + UPDATE + DELETE
-- ================================================================

CREATE POLICY flags_insert_anyone
  ON public.flags
  FOR INSERT
  WITH CHECK (
    raised_by IS NULL OR raised_by = auth.uid()
  );

CREATE POLICY flags_all_moderator
  ON public.flags
  FOR ALL
  USING (public.is_moderator())
  WITH CHECK (public.is_moderator());
