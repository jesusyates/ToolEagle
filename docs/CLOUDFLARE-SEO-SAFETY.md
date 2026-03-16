# Cloudflare SEO Safety Configuration

To avoid search engine crawlers (Googlebot, Bingbot, etc.) being blocked by WAF:

## WAF Rules

1. Go to **Cloudflare Dashboard** → **Security** → **WAF** → **Custom rules**
2. Create a rule to **Skip** (or Allow) requests matching:
   - **URI Path** contains: `sitemap` OR `robots.txt`
   - **URI Path** equals: `/sitemap.xml` OR starts with `/sitemap-` OR `/robots.txt`

## User-Agent Allowlist (Optional)

If using Bot Fight Mode or similar, add these User-Agents to an allowlist:

- `Googlebot`
- `Bingbot`
- `AhrefsBot`
- `SemrushBot`

## Paths to Bypass

| Path | Purpose |
|------|---------|
| `/sitemap.xml` | Main sitemap index |
| `/sitemap-*.xml` | All sitemap sub-parts |
| `/api/sitemap*` | Sitemap API routes |
| `/robots.txt` | Robots directives |
