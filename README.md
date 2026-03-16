# ToolEagle

AI tools for TikTok, YouTube and Instagram creators. Generate captions, hooks, hashtags and titles in seconds. Free, no sign-up.

## Features

- **Caption Generator** - TikTok / Instagram captions with emojis and hashtags
- **Hook Generator** - Viral hooks for short-form video
- **Hashtag Generator** - Niche-friendly hashtags for Reels and Shorts
- **Title Generator** - YouTube video titles that get clicks
- **Creator Mode** - Generate hook, caption, hashtags and video idea in one go

## Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Required Environment Variables

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SITE_URL` | Site URL (e.g. `https://www.tooleagle.com`) |
| `OPENAI_API_KEY` | OpenAI API key for AI generation |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role (sitemap, admin) |
| `UPSTASH_REDIS_REST_URL` | Upstash Redis REST URL |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis REST token |
| `CRON_SECRET` | Secret for cron jobs (generate-examples) |
| `GSC_CLIENT_EMAIL` | (Optional) Google Search Console |
| `GSC_PRIVATE_KEY` | (Optional) Google Search Console |
| `GSC_SITE_URL` | (Optional) Override site URL for GSC |
| `CRON_SECRET` | Required for /api/generate-examples and /api/generate-content cron |
| `NEXT_PUBLIC_SENTRY_DSN` | (Optional) Sentry DSN for error monitoring |
| `SENTRY_ORG` | (Optional) Sentry org slug |
| `SENTRY_PROJECT` | (Optional) Sentry project slug |

## Deploy

Deploy to [Vercel](https://vercel.com) by connecting this repo. Add environment variables as listed above.

## Tech Stack

- Next.js 14
- React 18
- Supabase
- Tailwind CSS

## License

MIT
