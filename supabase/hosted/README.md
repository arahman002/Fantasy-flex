# Hosted project configuration

The existing **Fantasy flex** Supabase project (`abfjcehstoujfvshnnni`) has been restored and connected to https://fantasy-flex-preview.onrender.com. Render contains the project URL and a public publishable key; no service role key is used by the app. The legacy environment variable name `VITE_SUPABASE_ANON_KEY` currently holds the modern publishable key.

The hosted project already had a richer schema, including memberships and financial settings. The original fresh-project migration must **not** be run against it. `dashboard_compatibility.sql` is an audit copy of the additive migration already applied remotely. It adds dashboard metadata, normalizes sport names to the existing lowercase format, creates commissioner memberships at transaction end, and grants authenticated users only the column-level insert access needed by this app. The existing membership read policy and creation RPC are preserved.

`verify_dashboard.sql` passed against the hosted database. It checks dashboard insert/read, commissioner membership creation, sport normalization, the existing creation RPC, cross-account isolation, and anonymous denial. Synthetic users and leagues are rolled back.

## Remaining auth dashboard setting

Open https://supabase.com/dashboard/project/abfjcehstoujfvshnnni/auth/url-configuration and set:

- **Site URL:** `https://fantasy-flex-preview.onrender.com`
- **Redirect URLs:** `https://fantasy-flex-preview.onrender.com` and `https://fantasy-flex-preview.onrender.com/`
- Optional local development redirect: `http://localhost:5173`

Email signup and email confirmation are enabled. The available integration cannot update Auth URL configuration, and verification showed the default redirect still points to `http://localhost:3000`. Change this before testing email confirmation. The deployed sign-in form was verified to reach Supabase Auth and reject invalid credentials correctly; a real email-confirmation signup was not performed.

The security advisor reported 14 pre-existing warnings for authenticated execution of SECURITY DEFINER RPCs. The new private trigger functions are not exposed to client roles and introduced no additional security warnings. Review existing RPCs separately: https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable
