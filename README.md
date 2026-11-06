# Fantasy Flex

A responsive fantasy league workspace built with React 19, TypeScript, Vite, and Supabase. Includes email/password sign-in and sign-up, session restoration, sign-out, a protected dashboard, league creation and search, league detail dialogs, and a session-only demo.

## Local development

Requires Node.js 22.12+ (or 24+) and npm.

```sh
npm ci
cp .env.example .env
npm run dev
```

Without environment variables, the sign-in screen offers an explicit demo. Demo leagues and changes are held in memory and reset when you leave the demo or refresh. Production sessions use Supabase; authenticated users never fall back to demo data.

## Supabase setup

1. Create a Supabase project and enable Email authentication.
2. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in `.env` using the project URL and public anon key. Never use a service role key in the browser.
3. Apply `supabase/migrations/202611060001_create_leagues.sql` using the Supabase SQL editor, or link the Supabase CLI project and run `supabase db push`.
4. Set the Auth Site URL to your application URL. Add `http://localhost:5173` and your production origin to the allowed redirect URLs. Email confirmation is supported; after confirmation, sign in if a session was not created automatically.
5. Start the app, create an account, confirm your email, and create a league.

The database enforces owner-only CRUD through row level security. A new account starts with an empty league list. Team counts are configured slots, not actual joined members. League membership, invitations, drafts, player feeds, rosters, and scoring execution are future features.

## Checks and production build

```sh
npm test
npm run build
npm run preview
```

GitHub Actions installs the committed lockfile with `npm ci`, runs validation tests, and performs TypeScript checking and a production build.

Deploy the `dist` directory to any static host. Set the two public environment variables **before building**, because Vite embeds them at build time. Serve the application over HTTPS.

## Manual acceptance checks

- At mobile and desktop widths, open the demo, search by name/sport, create a league, inspect its details, and exit the demo. Refresh to verify demo changes do not persist.
- With Supabase configured, verify signup confirmation, sign-in, session restoration after refresh, and sign-out. Check invalid credentials and network failure feedback.
- Create a real league, refresh, and verify it persists. With a second account, confirm the first account's leagues are absent. Test direct API reads and mutations with both tokens to validate database policies.
- Test keyboard navigation, dialog Escape dismissal and focus return, empty search results, and an account with no leagues.
