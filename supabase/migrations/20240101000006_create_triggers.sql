-- ================================================================
-- handle_review_insert
-- Runs AFTER INSERT on reviews.
-- Updates video approval/rejection counts, auto-transitions video
-- status when thresholds are met, and increments reviewer stats.
-- SECURITY DEFINER — must bypass RLS to write to videos/reviewers.
-- ================================================================
CREATE OR REPLACE FUNCTION public.handle_review_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_trusted      boolean;
  v_approval_count  integer;
  v_rejection_count integer;
BEGIN
  -- Get reviewer's trusted status
  SELECT is_trusted
  INTO v_is_trusted
  FROM public.reviewers
  WHERE id = NEW.reviewer_id;

  -- Increment the relevant vote counter
  IF NEW.verdict = 'approve' THEN
    UPDATE public.videos
    SET approval_count = approval_count + 1
    WHERE id = NEW.video_id;
  ELSE
    UPDATE public.videos
    SET rejection_count = rejection_count + 1
    WHERE id = NEW.video_id;
  END IF;

  -- Read fresh counts after the increment
  SELECT approval_count, rejection_count
  INTO v_approval_count, v_rejection_count
  FROM public.videos
  WHERE id = NEW.video_id;

  -- Auto-approve: trusted reviewer needs 2, regular needs 3
  -- Guard: only transition from pending (idempotent)
  IF (v_is_trusted AND v_approval_count >= 2) OR v_approval_count >= 3 THEN
    UPDATE public.videos
    SET
      status   = 'approved',
      age_band = COALESCE(age_band, NEW.age_band_suggestion)
    WHERE id = NEW.video_id
      AND status = 'pending';

  -- Auto-reject: 3+ rejections with rejections outweighing approvals
  ELSIF v_rejection_count >= 3 AND v_rejection_count > v_approval_count THEN
    UPDATE public.videos
    SET status = 'rejected'
    WHERE id = NEW.video_id
      AND status = 'pending';
  END IF;

  -- Increment reviewer's lifetime review count
  UPDATE public.reviewers
  SET review_count = review_count + 1
  WHERE id = NEW.reviewer_id;

  RETURN NEW;
END;
$$;

CREATE TRIGGER reviews_after_insert
  AFTER INSERT ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.handle_review_insert();


-- ================================================================
-- handle_flag_insert
-- Runs AFTER INSERT on flags.
-- If a video accumulates 3+ open flags, suspend it back to pending
-- so moderators can review it again.
-- SECURITY DEFINER — must bypass RLS to write to videos.
-- ================================================================
CREATE OR REPLACE FUNCTION public.handle_flag_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_open_flag_count integer;
BEGIN
  SELECT COUNT(*)
  INTO v_open_flag_count
  FROM public.flags
  WHERE video_id = NEW.video_id
    AND status = 'open';

  IF v_open_flag_count >= 3 THEN
    UPDATE public.videos
    SET status = 'pending'
    WHERE id = NEW.video_id
      AND status = 'approved';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER flags_after_insert
  AFTER INSERT ON public.flags
  FOR EACH ROW EXECUTE FUNCTION public.handle_flag_insert();
