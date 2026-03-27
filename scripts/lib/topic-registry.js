const fs = require("fs");
const path = require("path");

const REGISTRY_PATH = path.join(process.cwd(), "generated", "topic-registry.json");

function loadRegistry() {
  try {
    if (!fs.existsSync(REGISTRY_PATH)) return { updatedAt: new Date().toISOString(), topics: [] };
    const d = JSON.parse(fs.readFileSync(REGISTRY_PATH, "utf8"));
    if (!Array.isArray(d?.topics)) return { updatedAt: new Date().toISOString(), topics: [] };
    return d;
  } catch {
    return { updatedAt: new Date().toISOString(), topics: [] };
  }
}

function saveRegistry(reg) {
  const out = { ...reg, updatedAt: new Date().toISOString() };
  fs.mkdirSync(path.dirname(REGISTRY_PATH), { recursive: true });
  fs.writeFileSync(REGISTRY_PATH, JSON.stringify(out, null, 2), "utf8");
}

function getTopic(reg, topicKey) {
  return reg.topics.find((t) => t.topicKey === topicKey);
}

function similarUrlExists(topic, url) {
  if (!topic || !url) return false;
  return (topic.pages || []).some((p) => String(p.url).toLowerCase() === String(url).toLowerCase());
}

function decideGeneration({ registry, topicKey, platform, type, url, intent, answerUrl }) {
  const topic = getTopic(registry, topicKey);
  if (!topic) return { decision: "allow", reason: "new_topic" };

  if (similarUrlExists(topic, url)) return { decision: "skip", reason: "duplicate_url" };

  const primaryType = topic.primaryType;
  const primaryUrl = topic.primaryUrl;
  const intentStr = String(intent || "");

  if (type === "answer" && primaryType === "answer") return { decision: "skip", reason: "answer_never_primary" };

  if (type === primaryType && url !== primaryUrl) {
    return { decision: "skip", reason: "primary_conflict_same_type" };
  }

  if (primaryType === "guide" && type === "blog" && /how-to|workflow/i.test(intentStr)) {
    return { decision: "skip", reason: "guide_primary_blocks_howto_blog" };
  }

  if (primaryType === "blog" && type === "guide" && /idea|example|list/i.test(intentStr)) {
    if (answerUrl && !similarUrlExists(topic, answerUrl)) {
      return {
        decision: "downgrade",
        reason: "blog_primary_blocks_overlapping_guide",
        downgradeTo: { type: "answer", url: answerUrl }
      };
    }
    return { decision: "skip", reason: "blog_primary_blocks_overlapping_guide" };
  }

  return { decision: "allow", reason: "no_conflict" };
}

function upsertTopicPage({
  registry,
  topicKey,
  platform,
  type,
  url,
  primaryType,
  primaryUrl,
  createdAt = new Date().toISOString()
}) {
  if (!topicKey || !url) return registry;
  if (type === "answer" && primaryType === "answer") primaryType = "blog";

  let topic = getTopic(registry, topicKey);
  if (!topic) {
    topic = {
      topicKey,
      platform,
      primaryType: primaryType === "guide" ? "guide" : "blog",
      primaryUrl: primaryType === "guide" ? primaryUrl || url : primaryUrl || url,
      pages: [],
      lastUpdated: new Date().toISOString()
    };
    registry.topics.push(topic);
  }

  if (!topic.primaryType || topic.primaryType === "answer") topic.primaryType = "blog";
  if (!topic.primaryUrl) topic.primaryUrl = url;

  const exists = topic.pages.find((p) => p.type === type && p.url === url);
  if (!exists) {
    topic.pages.push({ type, url, createdAt });
  }

  // Set primary only for non-answer types.
  if (type !== "answer" && primaryType && primaryUrl && topic.primaryType !== primaryType) {
    topic.primaryType = primaryType;
    topic.primaryUrl = primaryUrl;
  }

  topic.lastUpdated = new Date().toISOString();
  return registry;
}

module.exports = {
  REGISTRY_PATH,
  loadRegistry,
  saveRegistry,
  decideGeneration,
  upsertTopicPage
};

