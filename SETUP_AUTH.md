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
| **Authorized JavaScript origins** | `http://localhost:8000`, `https://YOUR-VERCEL-DOMAIN.vercel.app` |
| **Authorized redirect URIs** | `https://YOUR-PROJECT-REF.supabase.co/auth/v1/callback` |

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
| **Site URL** | `https://YOUR-VERCEL-DOMAIN.vercel.app` |
| **Redirect URLs** | `http://localhost:8000/**` |
| | `https://YOUR-VERCEL-DOMAIN.vercel.app/**` |

The app callback page is: `https://YOUR-DOMAIN/auth/callback.html`

---

### 5. Run SQL migrations in Supabase

Open **SQL Editor** and run these files **in order**:

1. `supabase/migrations/001_sprint_leaderboard.sql` (if not already run)
2. `supabase/migrations/002_add_correct_count.sql` (if not already run)
3. `supabase/migrations/004_multiplication_auth.sql` ← **required for Google sign-in**

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

Only **signed-in** users can insert new scores (RLS).

---

## Vercel deployment

1. Connect the GitHub repo to Vercel
2. Framework: **Other** (static site)
3. No build command needed (or `echo ok`)
4. Output directory: `.` (repo root)
5. Add environment variables only if you inject config at build time; otherwise keep keys in `js/supabase-config.js`

After deploy, update Supabase **Site URL** and **Redirect URLs** to your Vercel domain.

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
| Redirect loop / 404 after Google | Add Vercel URL to Supabase Redirect URLs |
| `auth/callback` error | Confirm Google redirect URI is Supabase `/auth/v1/callback` |
| Score not saving | Run migration `004_multiplication_auth.sql`; user must be signed in |
| Username taken | Pick a different username in Settings |
| Delete account fails | Ensure `delete_own_account()` RPC exists (migration 004) |
