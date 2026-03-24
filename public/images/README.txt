Header logo (code)
------------------
- `ToolEagleLogoMark` (`src/components/brand/ToolEagleLogoMark.tsx`): gradient **fills the full 44×44** square + centered white bird icon — no PNG crop/留白.
- Variants: `global` (EN), `cn` (ZH gradient).

Optional assets (unused by header after V109 logo component)
-------------------------------------------------------------
- `log.png`, `11.png` — kept if you want them elsewhere (favicon, OG image, etc.).

English home hero (`HomeHeroGenerate`)
--------------------------------------
- **Default:** `home-hero-en.png` (full-bleed `next/image` + dark/cyan scrims for legibility).
- **Optional:** `NEXT_PUBLIC_HOME_HERO_BG_URL` — replaces the default asset path.
