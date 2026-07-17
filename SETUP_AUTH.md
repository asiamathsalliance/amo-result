# Multiplication Game — Google Sign-In Setup

The multiplication sprint uses **Supabase Auth (Google OAuth)**. Google credentials live in the **Supabase dashboard**, not in this repo.

## What you need to provide / configure

### 1. Supabase project (already started)

From **Supabase → Settings → API**:

| Value | Where it goes |
|-------|----------------|
| **Project URL** | `js/supabase-config.js` → `SUPABASE_URL` |
| **anon public key** | `js/supabase-config.js` → `SUPABASE_ANON_KEY` |

Optional local override: copy `js/supabase-config.local.example.js` → `js/supabase-config.local.js` (gitignored).

You do **not** put the service role key in the browser.

---

### 2. Google Cloud OAuth client

1. Open [Google Cloud Console](https://console.cloud.google.com/) → **APIs & Services → Credentials**
2. Create **OAuth 2.0 Client ID** → type **Web application**
3. Set:

| Field | Value |
|-------|--------|
| **Authorized JavaScript origins** | `http://localhost:8000`, `http://127.0.0.1:8000`, `https://YOUR-VERCEL-DOMAIN.vercel.app` |
| **Authorized redirect URIs** | `https://jfabsdvuzdyfwzxfnoem.supabase.co/auth/v1/callback` |

**Critical:** In Google, the redirect URI is **only** the Supabase callback above — **not** `http://localhost:8000/auth/callback.html`. Supabase handles Google, then sends the user back to your app.

**Important:** `localhost` and `127.0.0.1` are different origins to Google. Add whichever address you use in the browser.

OAuth client type must be **Web application** (not Desktop, iOS, or Android).

Copy the **Client ID** and **Client Secret**.

---

### 3. Supabase — enable Google provider

**Authentication → Providers → Google**

- Enable Google
- Paste **Client ID** and **Client Secret** from Google Cloud

---

### 4. Supabase — URL configuration

**Authentication → URL Configuration**

| Setting | Example |
|---------|---------|
| **Site URL** | `http://localhost:8000` (local) or `https://YOUR-VERCEL-DOMAIN.vercel.app` |
| **Redirect URLs** | `http://localhost:8000/**` |
| | `http://127.0.0.1:8000/**` |
| | `https://YOUR-VERCEL-DOMAIN.vercel.app/**` |

The app callback page is: `https://YOUR-DOMAIN/auth/callback.html`

---

### 5. Run SQL migrations in Supabase

Open **SQL Editor** and run these files **in order**:

1. `supabase/migrations/001_sprint_leaderboard.sql` (if not already run)
2. `supabase/migrations/002_add_correct_count.sql` (if not already run)
3. `supabase/migrations/004_multiplication_auth.sql` ← **required for Google sign-in**
4. `supabase/migrations/005_leaderboard_one_best_per_user.sql` ← **one row per user, best score kept**

Optional: `supabase/reset_leaderboard_seed.sql` for demo leaderboard data.

---

## Database tables (multiplication game)

### `multiplication_profiles`

| Column | Description |
|--------|-------------|
| `id` | Same as `auth.users.id` |
| `email` | Google email |
| `username` | Leaderboard display name (editable, unique) |
| `country` | User-selected country |
| `grade` | User-selected grade |
| `avatar_url` | Google profile photo URL |

Created automatically on first Google sign-in (DB trigger).

### `sprint_leaderboard` (updated)

| Column | Description |
|--------|-------------|
| `user_id` | Links score to signed-in user |
| `alias` | Username at time of play |
| `correct_count` | Correct answers |
| `score` | Points |

Only **signed-in** users can save scores (via `upsert_sprint_leaderboard_best` RPC). Each user has **at most one row** — their personal best by `correct_count`, then `score`.

---

## Vercel deployment

1. Connect the GitHub repo to [Vercel](https://vercel.com) → **Add New Project** → import `asiamathsalliance/amo-result`
2. Framework preset: **Other** (static site)
3. Build command: leave empty (or `echo ok`)
4. Output directory: `.` (repo root)
5. Deploy — your site will be at `https://YOUR-PROJECT.vercel.app` (or a custom domain)

No Vercel environment variables are required for Supabase if keys stay in `js/supabase-config.js`.

### After deploy — update these 3 places with your Vercel URL

Replace `https://YOUR-VERCEL-DOMAIN.vercel.app` below with your real Vercel URL (e.g. `https://amo-result.vercel.app`).

| Service | Where | What to add |
|---------|--------|-------------|
| **Google Cloud** | APIs & Services → Credentials → OAuth 2.0 Client → **Authorized JavaScript origins** | `https://YOUR-VERCEL-DOMAIN.vercel.app` |
| **Google Cloud** | Same client → **Authorized redirect URIs** | `https://jfabsdvuzdyfwzxfnoem.supabase.co/auth/v1/callback` only (unchanged) |
| **Supabase** | Authentication → URL Configuration → **Site URL** | `https://YOUR-VERCEL-DOMAIN.vercel.app` |
| **Supabase** | Authentication → URL Configuration → **Redirect URLs** | `https://YOUR-VERCEL-DOMAIN.vercel.app/**` |

Keep localhost entries in Google origins and Supabase redirect URLs for local dev:

- Google origins: `http://localhost:8000`, `http://127.0.0.1:8000`
- Supabase redirect URLs: `http://localhost:8000/**`, `http://127.0.0.1:8000/**`

OAuth callback page on your site: `https://YOUR-VERCEL-DOMAIN.vercel.app/auth/callback.html`

---

## User flow

1. **Not signed in** — Multiplication section shows **Sign in with Google**
2. **Signed in** — Shows **Continue as [username]** + **Start Sprint**
3. **Header** — Google avatar circle (right of nav, before Contact Us) → Settings / Sign out
4. **Settings** — Edit username, country, grade; delete account
5. **Leaderboard** — Unchanged display; scores tied to username + `user_id`

AMO Preliminary results, certificates, and other sections do **not** require sign-in.

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| **"Access blocked: This app's request is invalid"** | Add `https://jfabsdvuzdyfwzxfnoem.supabase.co/auth/v1/callback` to Google **Authorized redirect URIs** (Web application client). Do **not** put localhost in redirect URIs. |
| **"Not authorized origins"** from Google | Add your exact browser URL to Google **Authorized JavaScript origins** (`http://localhost:8000` and/or `http://127.0.0.1:8000`) |
| Nav clicks do nothing | Hard-refresh (`Cmd+Shift+R`); nav now uses hash links + `js/home-nav.js` |
| Redirect loop / 404 after Google | Add Vercel URL to Supabase Redirect URLs |
| `auth/callback` error | Confirm Google redirect URI is Supabase `/auth/v1/callback` |
| Score not saving | Run migrations `004_multiplication_auth.sql` and `005_leaderboard_one_best_per_user.sql`; user must be signed in |
| Duplicate users on leaderboard | Run migration `005_leaderboard_one_best_per_user.sql` in Supabase SQL Editor |
| Username taken | Pick a different username in Settings |
| Delete account fails | Ensure `delete_own_account()` RPC exists (migration 004) |
