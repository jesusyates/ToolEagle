import { redirect } from "next/navigation";

/** Canonical V95 URL is /ai-caption-generator (top-level). */
export default function AiCaptionToolAliasPage() {
  redirect("/ai-caption-generator");
}
