const fs = require("fs");
const path = require("path");
const matter = require("gray-matter");
const mdx = require("@mdx-js/mdx");

const LOG_PATH = path.join(process.cwd(), "logs", "mdx-write-failures.jsonl");

function ensureDirForFile(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function appendJsonl(obj) {
  ensureDirForFile(LOG_PATH);
  fs.appendFileSync(LOG_PATH, JSON.stringify(obj) + "\n", "utf8");
}

/**
 * Deterministic MDX safety sanitizer for EN blog-like plain prose.
 *
 * Guardrails (current scope):
 * - Convert "<2 mins" / "<3 tips" style prose into safe text ("under 2 ...").
 *
 * Implementation detail:
 * - mask fenced code blocks and inline code (backticks), sanitize remaining text only
 */
function sanitizePlainTextUnsafeFragments(text) {
  let out = String(text || "");

  // <2 mins / <3 minutes / <2 min ...
  // Keep meaning as "under N minutes".
  out = out.replace(/(^|[^&])<(\d+)\s+(min|mins|minute|minutes)\b/gi, (_, prefix, n, unit) => `${prefix}under ${n} ${unit}`);

  // Generic "<N <word>>" in prose.
  out = out.replace(/(^|[^&])<(\d+)\s+([A-Za-z][A-Za-z0-9_-]{0,20})\b/g, (_, prefix, n, word) => `${prefix}under ${n} ${word}`);

  return out;
}

function maskCodeBlocksAndInlineCode(mdxString) {
  const str = String(mdxString || "");
  const codeBlocks = [];
  const inlineCodes = [];

  // 1) fenced code blocks
  const fencedMasked = str.replace(/```[\s\S]*?```/g, (m) => {
    const i = codeBlocks.push(m) - 1;
    return `@@MDX_CODEBLOCK_${i}@@`;
  });

  // 2) inline code
  const inlineMasked = fencedMasked.replace(/`[^`]*`/g, (m) => {
    const i = inlineCodes.push(m) - 1;
    return `@@MDX_INLINECODE_${i}@@`;
  });

  return { masked: inlineMasked, codeBlocks, inlineCodes };
}

function unmaskMaskedContent(masked, masks) {
  let out = String(masked || "");
  for (let i = 0; i < (masks.codeBlocks || []).length; i++) {
    out = out.replace(`@@MDX_CODEBLOCK_${i}@@`, masks.codeBlocks[i]);
  }
  for (let i = 0; i < (masks.inlineCodes || []).length; i++) {
    out = out.replace(`@@MDX_INLINECODE_${i}@@`, masks.inlineCodes[i]);
  }
  return out;
}

function sanitizeMdxStringForWrite(mdxString) {
  const masks = maskCodeBlocksAndInlineCode(mdxString);
  const sanitized = sanitizePlainTextUnsafeFragments(masks.masked);
  return unmaskMaskedContent(sanitized, masks);
}

function sanitizeMdxBodyForWrite(body) {
  return sanitizePlainTextUnsafeFragments(body);
}

/**
 * Compile-check only the MDX "content/body" portion.
 * - If fails: do not throw; log to logs/mdx-write-failures.jsonl
 * - Returns { ok: boolean, sanitizedMdx: string }
 */
function sanitizeAndValidateMdxForWrite({
  mdxString,
  filePath,
  slug,
  failureKind = "mdx_compile_check"
}) {
  const sanitizedMdx = sanitizeMdxStringForWrite(mdxString);
  try {
    const parsed = matter(sanitizedMdx);
    const body = String(parsed.content || "");
    mdx.compileSync(body, { outputFormat: "function-body" });
    return { ok: true, sanitizedMdx };
  } catch (e) {
    appendJsonl({
      at: new Date().toISOString(),
      kind: failureKind,
      slug: slug ?? null,
      file: filePath ?? null,
      error: e?.message ? String(e.message) : String(e)
    });
    return { ok: false, sanitizedMdx };
  }
}

module.exports = {
  sanitizePlainTextUnsafeFragments,
  sanitizeMdxStringForWrite,
  sanitizeMdxBodyForWrite,
  sanitizeAndValidateMdxForWrite,
  LOG_PATH
};

