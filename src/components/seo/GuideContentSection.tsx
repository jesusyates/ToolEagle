import type { GuidePageType } from "@/config/traffic-topics";
import { getGuideContent } from "@/config/guide-content";

type Props = { pageType: GuidePageType; topic: string };

export function GuideContentSection({ pageType, topic }: Props) {
  const raw = getGuideContent(pageType, topic);
  const blocks = raw.split(/\n(?=## |### )/).filter(Boolean);

  return (
    <section className="mt-10 prose prose-slate max-w-none">
      <div className="text-slate-700 leading-relaxed space-y-6">
        {blocks.map((block, i) => {
          if (block.startsWith("## ")) {
            const rest = block.slice(3).trim();
            const [title, ...contentLines] = rest.split("\n");
            const content = contentLines.join("\n").trim();
            return (
              <div key={i}>
                <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-4 first:mt-0">
                  {title}
                </h2>
                {content && (
                  <div className="space-y-2 text-slate-700 leading-relaxed">
                    {content.split(/\n\n+/).map((para, j) =>
                      /^\d+\.\s/.test(para) ? (
                        <ol key={j} className="ml-4 list-decimal space-y-1">
                          {para.split("\n").map((line, k) => (
                            <li key={k}>{line.replace(/^\d+\.\s/, "")}</li>
                          ))}
                        </ol>
                      ) : (
                        <p key={j}>{para}</p>
                      )
                    )}
                  </div>
                )}
              </div>
            );
          }
          if (block.startsWith("### ")) {
            const rest = block.slice(4).trim();
            const [title, ...contentLines] = rest.split("\n");
            const content = contentLines.join("\n").trim();
            const items = content.split(/\n/).filter(Boolean);
            return (
              <div key={i}>
                <h3 className="text-lg font-semibold text-slate-900 mt-6 mb-2">{title}</h3>
                {items.some((line) => /^\d+\.\s/.test(line)) ? (
                  <ol className="ml-4 list-decimal space-y-1 text-slate-700">
                    {items.map((line, j) => (
                      <li key={j}>{line.replace(/^\d+\.\s/, "")}</li>
                    ))}
                  </ol>
                ) : (
                  <p className="text-slate-700 leading-relaxed">{content}</p>
                )}
              </div>
            );
          }
          const lines = block.split("\n").filter(Boolean);
          return (
            <div key={i} className="space-y-2">
              {lines.map((line, j) => {
                if (/^\d+\.\s/.test(line)) {
                  return (
                    <li key={j} className="ml-4 list-decimal">
                      {line.replace(/^\d+\.\s/, "")}
                    </li>
                  );
                }
                return (
                  <p key={j} className="text-slate-700 leading-relaxed">
                    {line}
                  </p>
                );
              })}
            </div>
          );
        })}
      </div>
    </section>
  );
}
