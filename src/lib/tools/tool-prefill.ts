export type ToolPrefillParams = {
  topic: string | null;
  intent: string | null;
  workflow: string | null;
  source: string | null;
  platform: string | null;
  autostart: boolean;
};

type SearchParamsLike = { get(name: string): string | null };

function norm(v: string | null): string | null {
  if (typeof v !== "string") return null;
  const s = v.trim();
  return s.length > 0 ? s : null;
}

export function parseToolPrefillParams(searchParams: SearchParamsLike): ToolPrefillParams {
  const topic = norm(searchParams.get("topic") ?? searchParams.get("q"));
  const intent = norm(searchParams.get("intent"));
  const workflow = norm(searchParams.get("workflow"));
  const source = norm(searchParams.get("source"));
  const platform = norm(searchParams.get("platform"));
  const autostart = (searchParams.get("autostart") ?? "") === "1";
  return { topic, intent, workflow, source, platform, autostart };
}

