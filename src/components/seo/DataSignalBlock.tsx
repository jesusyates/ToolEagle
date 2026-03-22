/**
 * V78: Data-style sentences to boost AI citation.
 * 1–2 "data signal" sentences per page.
 */

type Props = {
  signals: string[];
  lang?: "zh" | "en";
};

export function DataSignalBlock({ signals, lang = "zh" }: Props) {
  if (!signals?.length) return null;

  const items = signals.slice(0, 2);

  return (
    <div
      className="mt-4 rounded-lg border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm text-slate-600"
      role="note"
      aria-label={lang === "zh" ? "数据参考" : "Data reference"}
    >
      {items.map((s, i) => (
        <p key={i} className={i > 0 ? "mt-2" : ""}>
          {s}
        </p>
      ))}
    </div>
  );
}
