function validateGuideLike(text) {
  const s = String(text || "").toLowerCase();
  const hasHowTo = s.includes("how to");
  const hasSteps = /##\s*step\s*\d+/i.test(text || "") || /\n\d+\.\s/.test(text || "");
  return { ok: hasHowTo && hasSteps, reason: hasHowTo && hasSteps ? null : "guide_requires_howto_and_steps" };
}

function validateBlogLike(text, title) {
  const t = String(title || "").toLowerCase();
  const s = String(text || "").toLowerCase();
  const hasList = /\n\d+\.\s/.test(text || "");
  const hasIdeaSignal = /idea|ideas|example|examples|best|top|list/.test(`${t} ${s}`);
  return { ok: hasList || hasIdeaSignal, reason: hasList || hasIdeaSignal ? null : "blog_requires_list_or_idea_pattern" };
}

function validateAnswerLike(text, question) {
  const s = String(text || "").trim();
  const q = String(question || "").trim();
  const shortEnough = s.length > 0 && s.length <= 700;
  const questionLike = /\?$/.test(q) || /^(how|what|when|why|should|can|is|are)\b/i.test(q);
  return { ok: shortEnough && questionLike, reason: shortEnough && questionLike ? null : "answer_requires_direct_short_question_format" };
}

module.exports = {
  validateGuideLike,
  validateBlogLike,
  validateAnswerLike
};

