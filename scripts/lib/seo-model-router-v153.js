/**
 * V153 cost control: DeepSeek (primary via OPENAI_BASE_URL), GLM optional for CN, OpenAI only explicit fallback.
 */

const { getBaseUrl, getModel } = require("./openai-fetch");

function baseLooksDeepSeek() {
  return String(getBaseUrl()).toLowerCase().includes("deepseek");
}

function baseLooksOpenAI() {
  const b = String(getBaseUrl()).toLowerCase();
  return b.includes("api.openai.com");
}

/**
 * @param {{ bulk?: boolean, forceOpenAiFallback?: boolean }} ctx
 */
function pickSeoChatConfig(ctx = {}) {
  const bulk = ctx.bulk !== false;
  const forceOpenAiFallback = !!ctx.forceOpenAiFallback;

  const openaiKey = process.env.OPENAI_API_KEY;
  const glmKey = process.env.GLM_API_KEY || process.env.ZHIPU_API_KEY;

  if (forceOpenAiFallback && process.env.SEO_ALLOW_OPENAI_FALLBACK === "1" && openaiKey) {
    return {
      apiKey: openaiKey,
      baseUrl: (process.env.OPENAI_FALLBACK_BASE_URL || "https://api.openai.com/v1").replace(/\/$/, ""),
      model: process.env.OPENAI_FALLBACK_MODEL || "gpt-4o-mini",
      model_cost_tier: "high",
      provider: "openai"
    };
  }

  if (bulk && baseLooksOpenAI()) {
    console.warn(
      "[v153_model_router] Bulk SEO pointed at OpenAI — set OPENAI_BASE_URL to DeepSeek (or proxy) to satisfy cost rules."
    );
  }

  if (glmKey && process.env.SEO_USE_GLM_FOR_CN === "1" && !baseLooksDeepSeek()) {
    return {
      apiKey: glmKey,
      baseUrl: (process.env.GLM_BASE_URL || "https://open.bigmodel.cn/api/paas/v4").replace(/\/$/, ""),
      model: process.env.GLM_MODEL || "glm-4-flash",
      model_cost_tier: "medium",
      provider: "glm"
    };
  }

  return {
    apiKey: openaiKey,
    baseUrl: getBaseUrl(),
    model: getModel(),
    model_cost_tier: baseLooksDeepSeek() ? "low" : "medium",
    provider: baseLooksDeepSeek() ? "deepseek" : "primary"
  };
}

module.exports = {
  pickSeoChatConfig,
  baseLooksDeepSeek,
  baseLooksOpenAI
};
