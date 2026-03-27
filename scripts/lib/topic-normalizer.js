const NOISE_WORDS = new Set([
  "ideas",
  "idea",
  "tips",
  "tip",
  "guide",
  "guides",
  "how",
  "to",
  "write",
  "best",
  "top",
  "for",
  "with",
  "the",
  "a",
  "an",
  "workflow",
  "examples",
  "example",
  "list",
  "lists"
]);

function compactToken(t) {
  if (!t) return "";
  if (t === "captions" || t === "caption") return "captions";
  if (t === "hooks" || t === "hook") return "hooks";
  if (t === "hashtags" || t === "hashtag") return "hashtags";
  if (t === "titles" || t === "title") return "titles";
  return t;
}

function normalizeTopicKey(input) {
  const raw = String(input || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  const tokens = raw
    .split("-")
    .map((t) => t.trim())
    .filter(Boolean)
    .filter((t) => !NOISE_WORDS.has(t))
    .map(compactToken);
  const uniq = [...new Set(tokens)];
  return uniq.join("-") || "unknown-topic";
}

function topicKeyFromParts({ platform, topic, slug, title }) {
  const joined = [platform, topic, slug, title].filter(Boolean).join("-");
  return normalizeTopicKey(joined);
}

module.exports = {
  normalizeTopicKey,
  topicKeyFromParts
};

