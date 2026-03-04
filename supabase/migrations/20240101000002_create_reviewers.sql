-- reviewer profiles — PK is auth.users.id (one row per user)
-- rows are inserted by the auth signup trigger in Phase 3, not directly
CREATE TABLE public.reviewers (
  id               uuid        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username         text        UNIQUE NOT NULL,
  reputation_score integer     NOT NULL DEFAULT 0,
  review_count     integer     NOT NULL DEFAULT 0,
  is_trusted       boolean     NOT NULL DEFAULT false,
  is_moderator     boolean     NOT NULL DEFAULT false,
  is_admin         boolean     NOT NULL DEFAULT false,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.reviewers ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER reviewers_updated_at
  BEFORE UPDATE ON public.reviewers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
