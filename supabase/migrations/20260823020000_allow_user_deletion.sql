-- ---------------------------------------------------------------------------
-- Make deleting an account possible again.
--
-- Deleting any verified user failed with 23514 on analytics_events_subject,
-- which meant a person could not delete their own account and an administrator
-- could not remove theirs — the right to erasure had no working path.
--
-- The cause was two correct rules meeting:
--
--   * analytics_events.user_id is declared ON DELETE SET NULL, so removing the
--     user blanks the column rather than removing the row.
--   * analytics_events_subject requires user_id IS NOT NULL OR anon_session_id
--     IS NOT NULL, because an event attributable to nobody cannot be counted.
--
-- A signup_completed row carries a user_id and no anon_session_id. Blanking the
-- user_id therefore left it attributable to nobody, the CHECK refused it, and
-- the whole DELETE rolled back. Confirmed by isolation: an unverified account,
-- which has no such row, deletes cleanly; a verified one does not.
--
-- The fix is to cascade instead of blanking. An event that exists only to say
-- "this person signed up" has no meaning once that person is gone, and erasure
-- is what deleting an account is supposed to mean — so the row goes with them.
-- Anonymous events are unaffected: they are keyed by anon_session_id, carry no
-- user_id, and no foreign key touches them.
--
-- Nothing else changes. The CHECK stays exactly as written, so an event still
-- cannot exist without a subject. No policy is altered, so RLS is untouched.
-- The trigger and its function are left alone; they were never at fault.
--
-- Forward-only and re-runnable: the constraint is dropped by name only if it is
-- present, then recreated.
-- ---------------------------------------------------------------------------

DO $$
DECLARE
  constraint_name TEXT;
BEGIN
  -- The foreign key was created inline, so its name is generated. Find it by
  -- what it points at rather than by guessing the name.
  SELECT con.conname INTO constraint_name
  FROM pg_constraint con
  JOIN pg_class rel ON rel.oid = con.conrelid
  JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
  WHERE nsp.nspname = 'public'
    AND rel.relname = 'analytics_events'
    AND con.contype = 'f'
    AND con.conkey = ARRAY[
      (SELECT attnum FROM pg_attribute
        WHERE attrelid = rel.oid AND attname = 'user_id')
    ]::smallint[]
  LIMIT 1;

  IF constraint_name IS NOT NULL THEN
    EXECUTE format(
      'ALTER TABLE public.analytics_events DROP CONSTRAINT %I',
      constraint_name
    );
  END IF;
END
$$;

ALTER TABLE public.analytics_events
  ADD CONSTRAINT analytics_events_user_id_fkey
  FOREIGN KEY (user_id)
  REFERENCES auth.users(id)
  ON DELETE CASCADE;

COMMENT ON CONSTRAINT analytics_events_user_id_fkey ON public.analytics_events IS
  'Cascades so deleting an account removes the events attributed to it. SET NULL left the row with no subject, which analytics_events_subject refuses, and that made account deletion impossible.';
