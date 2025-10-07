-- Ensure signup creates profile/company/role via trigger
-- Safe recreate of trigger linking auth.users -> public.handle_new_user
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE PROCEDURE public.handle_new_user();

-- Optional: verify function exists (no-op if already there)
-- Note: function public.handle_new_user is already defined in this project per configuration