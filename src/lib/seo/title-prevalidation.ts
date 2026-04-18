/**
 * Pre-generation title gate: cheap filter so expensive draft gen only runs on plausible SERP titles.
 */

export function isPreValidatedTitle(title: string): boolean {
  const t = (title || "").toLowerCase();

  return (
    /^(how to|best|.+ vs .+|.+ examples in \d{4}|best .+ compared)/i.test(title || "") &&
    /(blog|email|copy|ai|content|marketing)/i.test(t) &&
    !/(that works? well|strategy|playbook|system|guide$)/i.test(t) &&
    t.split(/\s+/).filter(Boolean).length >= 4
  );
}
