/**
 * Legacy Chinese SEO (v63 / v153 keyword + retrieval rewrite) — off by default.
 * Re-enable: ENABLE_LEGACY_ZH_SEO=1 npm run seo:generate:zh
 */

function isLegacyZhSeoEnabled() {
  const v = process.env.ENABLE_LEGACY_ZH_SEO;
  if (v === "1" || String(v).toLowerCase() === "true") return true;
  return false;
}

/** Call at script entry after dotenv. Exits 0 when disabled. */
function exitIfLegacyZhSeoDisabled() {
  if (isLegacyZhSeoEnabled()) return;
  console.log("[skip] legacy zh seo disabled");
  process.exit(0);
}

module.exports = { isLegacyZhSeoEnabled, exitIfLegacyZhSeoDisabled };
