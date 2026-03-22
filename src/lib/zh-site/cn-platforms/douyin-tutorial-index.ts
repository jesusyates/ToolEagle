import { DOUYIN_SCENES } from "./douyin-scenes";

export type DouyinTutorialIndexItem = {
  href: string;
  label: string;
  sceneTitle: string;
  kind: "guide" | "read";
};

/** 抖音「教程」页：聚合各场景下的教程与可读长文（去重） */
export function getDouyinTutorialIndex(): DouyinTutorialIndexItem[] {
  const seen = new Set<string>();
  const rows: DouyinTutorialIndexItem[] = [];
  for (const scene of DOUYIN_SCENES) {
    for (const g of scene.guides) {
      if (seen.has(g.href)) continue;
      seen.add(g.href);
      rows.push({ href: g.href, label: g.label, sceneTitle: scene.title, kind: "guide" });
    }
    for (const r of scene.reads) {
      if (seen.has(r.href)) continue;
      seen.add(r.href);
      rows.push({ href: r.href, label: r.label, sceneTitle: scene.title, kind: "read" });
    }
  }
  return rows;
}
