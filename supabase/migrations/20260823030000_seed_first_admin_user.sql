-- ---------------------------------------------------------------------------
-- Grant the first admin role.
--
-- public.user_roles was created empty and nothing ever wrote to it, so
-- has_role(uid, 'admin') was false for everyone and /app/admin was reachable by
-- nobody. This grants the role to the account that owns the project.
--
-- Three things this deliberately does not do:
--
--   * It does not create the account. Users are created through GoTrue, which
--     also writes auth.identities, hashes the password with the parameters the
--     running version expects, and fires the signup triggers. A row inserted
--     straight into auth.users has none of that, and the failure shows up later
--     as an account that cannot log in or reset its password.
--
--   * It does not contain a password. A migration is committed and pushed, so
--     any credential in one is published to everyone who can read the
--     repository and stays in history after it is edited out.
--
--   * It does not set an is_admin flag in user metadata. has_role reads this
--     table and only this table. raw_user_meta_data is writable by the account
--     itself through the normal update-user endpoint, so a privilege that lived
--     there could be granted by the person it is meant to restrain.
--
-- The account is found by email rather than by a hard-coded id, because ids
-- differ between the production project and any local or restored copy.
--
-- Forward-only, additive and re-runnable: the insert is a no-op once the role
-- is present, and the whole block is skipped when the account does not exist,
-- so a fresh database applies this without error and picks the role up the
-- next time it runs.
-- ---------------------------------------------------------------------------

DO $$
DECLARE
  admin_email  TEXT := 'mansouryassine12@gmail.com';
  admin_id     UUID;
BEGIN
  SELECT id INTO admin_id FROM auth.users WHERE email = admin_email;

  IF admin_id IS NULL THEN
    RAISE NOTICE 'No account for %; sign up first, then re-run this migration.', admin_email;
    RETURN;
  END IF;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (admin_id, 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;

  RAISE NOTICE 'Admin role present for %.', admin_email;
END
$$;
