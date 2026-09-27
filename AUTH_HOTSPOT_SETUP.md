# AgriSense AI — Auth & Hotspot Setup

## 1. Environment

Copy `.env.example` to `.env.local` and fill in the values for the Supabase project.

The service-role key is **server-only**. It must never be placed in a `VITE_*` variable or shipped to the browser.

Required server variables:

- `SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

Required browser variables:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

## 2. Email/password authentication

The application now supports both Supabase auth modes:

- If email confirmation is disabled, a new account is signed in immediately.
- If email confirmation is enabled, the app tells the user to confirm the email instead of immediately attempting a second password login.

The existing `handle_new_user` database trigger provisions the profile, role, and farmer farm when a new Supabase user is created.

## 3. Google sign-in

In Supabase Dashboard:

1. Open **Authentication → Providers → Google**.
2. Enable Google.
3. Add the Google OAuth client ID and client secret from Google Cloud.
4. Add Supabase's Auth callback URL shown by the Supabase dashboard to the Google OAuth client's authorized redirect URIs.
5. Add the deployed application's `/auth` URL to the Supabase Auth redirect allow-list.

The application now calls `supabase.auth.signInWithOAuth({ provider: "google" })` directly and returns to `/auth`, where the restored Supabase session is detected.

## 4. Hotspot map

The hotspot feed reads disease and pest detections from farms that opted into surveillance and always includes the signed-in user's own reports.

A farm must have latitude/longitude before its reports can be placed on the map. The Hotspot page now has **Set farm location / Update farm location** using browser geolocation.

The page also:

- reports server/database errors instead of silently showing an empty map;
- has a refresh action;
- preserves the privacy jitter for other farms;
- keeps the sharing toggle tied to the active farm.

## 5. Important security change

The service-role key was removed from `src/integrations/supabase/client.server.ts`. Keep it only in a server environment variable.

If the service-role key in the old project archive has ever been committed to a repository or shared outside the trusted environment, rotate it in Supabase before deploying the fixed project.
