import fs from "node:fs/promises";
import path from "node:path";
import type { PublishedCorpus } from "../types/preflight";
import type { TopicRegistryFile } from "./topic-registry-types";

function lastPathSegment(url: string): string {
  try {
    const u = url.startsWith("http") ? new URL(url).pathname : url;
    const parts = u.split("/").filter(Boolean);
    return parts[parts.length - 1] ?? "";
  } catch {
    return "";
  }
}

function hintFromSlugSegment(seg: string): string {
  if (!seg) return "";
  return seg.replace(/-/g, " ").replace(/\s+/g, " ").trim();
}

function humanizeTopicKey(topicKey: string): string {
  return topicKey.replace(/-/g, " ").replace(/\s+/g, " ").trim();
}

/** Load published URLs and title hints from `generated/topic-registry.json`. */
export async function loadPublishedCorpusFromTopicRegistry(repoRoot?: string): Promise<PublishedCorpus> {
  const root = repoRoot ?? process.cwd();
  const filePath = path.join(root, "generated", "topic-registry.json");
  const raw = await fs.readFile(filePath, "utf8");
  const data = JSON.parse(raw) as TopicRegistryFile;
  const urls = new Set<string>();
  const titleHints = new Set<string>();
  const topicKeys = new Set<string>();

  for (const row of data.topics ?? []) {
    topicKeys.add(row.topicKey);
    titleHints.add(humanizeTopicKey(row.topicKey));
    if (row.primaryUrl) {
      urls.add(row.primaryUrl);
      const h = hintFromSlugSegment(lastPathSegment(row.primaryUrl));
      if (h) titleHints.add(h);
    }
    for (const p of row.pages ?? []) {
      if (p?.url) {
        urls.add(p.url);
        const h = hintFromSlugSegment(lastPathSegment(p.url));
        if (h) titleHints.add(h);
      }
    }
  }

  return {
    urls: [...urls],
    titleHints: [...titleHints],
    topicKeys: [...topicKeys]
  };
}
