import { permanentRedirect } from "next/navigation";

/** V97.1 — Prefer short China-local path */
export default function ZhToolsTikTokCaptionAliasPage() {
  permanentRedirect("/zh/tiktok-caption-generator");
}
