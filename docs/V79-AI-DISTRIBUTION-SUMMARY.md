# V79 AI Distribution & Discovery Engine – Summary

## 1. AI-Friendly Sitemaps

| Sitemap | URL | Contents |
|---------|-----|----------|
| **sitemap-ai.xml** | /sitemap-ai.xml | ALL zh/search + ALL en/how-to + ai-feed + question hubs. priority 0.9–0.95, changefreq daily |
| **sitemap-en.xml** | /sitemap-en.xml | ALL en/how-to pages. priority 0.85, changefreq daily |
| **sitemap-questions.xml** | /sitemap-questions.xml | zh/search, zh/how-to, zh hub, en/how-to, question hubs, ai-feed. question pages priority 0.95 |

Added to sitemap-index and robots.txt.

## 2. AI Feed Page

**Route:** `/ai-feed`

- Simple HTML, links + short summaries
- Latest 50 zh keyword pages
- Latest 50 en how-to pages
- Question hub links
- Tool links

## 3. Question Hub Pages

| Route | Content |
|-------|---------|
| /questions/tiktok | 50–200 question links, grouped by intent (how-to, monetization, beginner, results) |
| /questions/youtube | Same structure |
| /questions/instagram | Same structure |

Links from zh/search (by platform) + en/how-to (platform-specific).

## 4. Internal Link Boost

**ZhKeywordPageTemplate:**
- `RelatedQuestionsBlock` – 10–20 related question links
- `AnswerIndexBlock` – "更多关于「X」的回答" with 10–20 links

**EnHowToPageTemplate:**
- `RelatedQuestionsBlock` – 10–20 related EN + zh links
- `AnswerIndexBlock` – "More answers about X"

Every page now links to: 5+ keyword pages, 3 how-to, 3 tool pages (via existing internal links + new blocks).

## 5. AI Crawl Signals

**robots.ts:**
- Allow GPTBot, PerplexityBot, Google-Extended
- Allow /ai-feed, /questions/, /en/
- New sitemaps in sitemap list

## 6. API Placeholder

**Route:** `/api/ai/ping`

- GET/POST return `{ ok: true, message }`
- Future: notify indexing systems, trigger crawl refresh

## 7. Crawl Depth (Before vs After)

**Before:**
- zh/search pages: linked from zh/sitemap, ZhRelatedRecommendations
- en/how-to: linked from en/how-to hub, EnHowToPageTemplate "More Guides"
- Crawl depth: ~3–4 clicks from homepage to most pages

**After:**
- ai-feed: 1 click to 50+ zh + 50+ en links
- question hubs: 1 click to 50–200 platform-specific links
- RelatedQuestionsBlock: 10–20 links per keyword page
- AnswerIndexBlock: 10–20 links per page
- sitemap-ai: direct XML for AI crawlers
- Crawl depth: 1–2 clicks from ai-feed or question hubs to most pages

**Link graph density:** +10–20 internal links per page (ZhKeywordPageTemplate, EnHowToPageTemplate).
