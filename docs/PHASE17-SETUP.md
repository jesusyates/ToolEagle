# Phase 17 – Account System Setup

## Prerequisites

1. [Supabase](https://supabase.com) account
2. A new Supabase project

## 1. Create Supabase Project

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard)
2. Create a new project
3. Wait for the project to be ready

## 2. Run Database Schema

1. In your Supabase project, go to **SQL Editor**
2. Copy the contents of `supabase-schema.sql` from the project root
3. Run the SQL to create `favorites` and `generation_history` tables with RLS

## 3. Enable Auth Providers

### Google OAuth

1. Go to **Authentication** → **Providers** → **Google**
2. Enable Google
3. Add your Google OAuth credentials (from [Google Cloud Console](https://console.cloud.google.com/apis/credentials))
4. Add `https://your-domain.com/auth/callback` to Authorized redirect URIs

### Email Magic Link

1. Go to **Authentication** → **Providers** → **Email**
2. Enable "Confirm email" is OFF for magic link (or configure as needed)
3. Supabase sends magic link emails by default (limited on free tier)

## 4. Environment Variables

Copy `.env.example` to `.env.local` and fill in:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Get these from **Project Settings** → **API** in the Supabase dashboard.

## 5. Site URL (for OAuth redirects)

In Supabase: **Authentication** → **URL Configuration**:

- **Site URL**: `http://localhost:3000` (dev) or `https://your-domain.com` (prod)
- **Redirect URLs**: Add `http://localhost:3000/auth/callback` and `https://your-domain.com/auth/callback`

## Summary

- **Login**: `/login` – Google or email magic link
- **Dashboard**: `/dashboard` – Favorites, recent generations (requires login)
- **Sync**: On first dashboard visit after login, localStorage data is merged to the cloud
