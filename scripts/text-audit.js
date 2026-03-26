/* eslint-disable no-console */
const fs = require("fs");
const path = require("path");
const cp = require("child_process");

const ROOT = process.cwd();
const CONFIG_PATH = path.join(ROOT, "scripts", "text-audit.config.json");

function toPosix(p) {
  return p.replace(/\\/g, "/");
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function walk(dir, out) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const abs = path.join(dir, entry.name);
    const rel = toPosix(path.relative(ROOT, abs));
    if (entry.isDirectory()) {
      walk(abs, out);
      continue;
    }
    out.push({ abs, rel: `/${rel}` });
  }
}

function parseAllowPattern(raw) {
  const pivot = raw.indexOf(".*");
  if (pivot < 0) {
    return { pathRe: new RegExp(raw), lineRe: null };
  }
  const pathPart = raw.slice(0, pivot);
  const linePart = raw.slice(pivot + 2);
  return {
    pathRe: new RegExp(pathPart),
    lineRe: linePart ? new RegExp(linePart) : null
  };
}

function isAllowed(relPath, lineText, allowEntries) {
  return allowEntries.some(({ pathRe, lineRe }) => {
    if (!pathRe.test(relPath)) return false;
    if (!lineRe) return true;
    return lineRe.test(lineText);
  });
}

function getChangedFileSet(baseRef) {
  try {
    const out = cp
      .execSync(`git diff --name-only --diff-filter=ACMRTUXB ${baseRef}...HEAD`, {
        cwd: ROOT,
        stdio: ["ignore", "pipe", "ignore"]
      })
      .toString("utf8");
    const lines = out
      .split(/\r?\n/)
      .map((s) => s.trim())
      .filter(Boolean)
      .map((s) => `/${toPosix(s)}`);
    return new Set(lines);
  } catch {
    return null;
  }
}

function main() {
  const args = process.argv.slice(2);
  const changedOnly = args.includes("--changed");
  const baseArg = args.find((a) => a.startsWith("--base="));
  const baseRef = baseArg ? baseArg.slice("--base=".length) : "origin/main";

  const cfg = readJson(CONFIG_PATH);
  const includeExts = new Set(cfg.includeExtensions || []);
  const excludeBits = cfg.excludePathSubstrings || [];
  const files = [];

  for (const rootRel of cfg.includeRoots || []) {
    const abs = path.join(ROOT, rootRel);
    if (!fs.existsSync(abs)) continue;
    walk(abs, files);
  }

  let filtered = files.filter((f) => {
    if (!includeExts.has(path.extname(f.rel))) return false;
    return !excludeBits.some((bit) => f.rel.includes(bit));
  });

  if (changedOnly) {
    const changedSet = getChangedFileSet(baseRef);
    if (!changedSet) {
      console.error(`[text-audit] WARN: cannot read git diff for base '${baseRef}', fallback to full scan`);
    } else {
      filtered = filtered.filter((f) => changedSet.has(f.rel));
      console.log(`[text-audit] changed-only mode: ${filtered.length} file(s), base=${baseRef}`);
    }
  }

  const violations = [];
  const rules = cfg.rules || {};

  for (const [ruleName, rule] of Object.entries(rules)) {
    if (!rule.enabled) continue;
    const pathRes = (rule.paths || []).map((p) => new RegExp(p));
    const patternRes = (rule.patterns || []).map((p) => new RegExp(p));
    const allowRes = (rule.allowPathPatterns || []).map(parseAllowPattern);

    const targetFiles = filtered.filter((f) => pathRes.some((re) => re.test(f.rel)));

    for (const file of targetFiles) {
      const text = fs.readFileSync(file.abs, "utf8");
      const lines = text.split(/\r?\n/);
      lines.forEach((line, idx) => {
        for (const pRe of patternRes) {
          if (!pRe.test(line)) continue;
          if (isAllowed(file.rel, line, allowRes)) continue;
          violations.push({
            rule: ruleName,
            file: file.rel,
            line: idx + 1,
            match: pRe.source,
            text: line.trim().slice(0, 220)
          });
        }
      });
    }
  }

  if (violations.length === 0) {
    console.log("[text-audit] PASS: no violations");
    process.exit(0);
  }

  console.error(`[text-audit] FAIL: ${violations.length} violation(s)`);
  for (const v of violations) {
    console.error(`- ${v.rule} ${v.file}:${v.line}`);
    console.error(`  pattern: ${v.match}`);
    console.error(`  line: ${v.text}`);
  }
  process.exit(1);
}

main();
