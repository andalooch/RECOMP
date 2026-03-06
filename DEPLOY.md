# RECOMP — Deployment Guide

## Overview
5 steps, ~20 minutes total. Result: a live URL with AI parsing and Google Sign In working.

---

## STEP 1 — Supabase (database + auth) ~5 min

1. Go to **supabase.com** → sign up free
2. New Project → name it "recomp" → create
3. Left sidebar → **SQL Editor** → paste contents of `supabase-schema.sql` → Run
4. Go to **Settings → API** → copy:
   - Project URL
   - anon public key
   - service_role secret key

---

## STEP 2 — Enable Google Sign In ~5 min

1. Go to **console.cloud.google.com** → create a new project called "recomp"
2. APIs & Services → **OAuth consent screen** → External → fill in App name "RECOMP" + your email → Save
3. APIs & Services → **Credentials** → Create Credentials → OAuth Client ID
   - Application type: **Web application**
   - Authorized redirect URIs: `https://YOUR-PROJECT-REF.supabase.co/auth/v1/callback`
   - (Find YOUR-PROJECT-REF in Supabase → Settings → General)
4. Copy the **Client ID** and **Client Secret**
5. In Supabase → **Authentication → Providers → Google** → enable → paste Client ID + Secret → Save

---

## STEP 3 — Anthropic API key ~2 min

1. Go to **console.anthropic.com** → sign up
2. API Keys → Create Key → copy it
3. Billing → add card ($5 free credit included)

---

## STEP 4 — GitHub ~3 min

1. Go to **github.com** → sign up free
2. Click + → New Repository → name "recomp" → Create
3. Unzip recomp-app.zip on your computer
4. Drag all files into the GitHub repo page → Commit changes

---

## STEP 5 — Vercel (live URL) ~5 min

1. Go to **vercel.com** → sign up with GitHub
2. Add New Project → select "recomp" repo → Import
3. Add these 4 Environment Variables before deploying:

```
NEXT_PUBLIC_SUPABASE_URL          → from Step 1
NEXT_PUBLIC_SUPABASE_ANON_KEY     → from Step 1
SUPABASE_SERVICE_ROLE_KEY         → from Step 1
ANTHROPIC_API_KEY                 → from Step 3
```

4. Click Deploy → wait ~2 min → live URL ready (e.g. https://recomp.vercel.app)

---

## STEP 6 — Final Supabase URL config ~1 min

1. In Supabase → **Authentication → URL Configuration**
2. Set Site URL to your Vercel URL: `https://recomp.vercel.app`
3. Add to Redirect URLs: `https://recomp.vercel.app/auth/callback`
4. Save

This is required for Google Sign In redirects to work after login.

---

## What you get

- Live URL on any device, no app store needed
- Google Sign In (one tap)
- Email/password login as fallback
- Forgot password flow (email reset)
- AI food + workout parsing via text, voice, and photo
- All user data private and isolated per account
- Free tier supports ~50,000 users

## Adding Apple Sign In later

When ready: go to developer.apple.com ($99/year), create a Sign In with Apple key, and enable the Apple provider in Supabase Authentication settings. The auth page code is already structured to add it in under an hour.

