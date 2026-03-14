import { ToolCopyButton } from "./ToolCopyButton";
import { ShareButtons } from "./ShareButtons";

type ToolResultListCardProps = {
  title: string;
  items: string[];
  isLoading?: boolean;
  onCopyItem: (index: number) => void;
  onCopyAll: () => void;
  emptyMessage: string;
  toolSlug?: string;
};

export function ToolResultListCard({
  title,
  items,
  isLoading = false,
  onCopyItem,
  onCopyAll,
  emptyMessage,
  toolSlug
}: ToolResultListCardProps) {
  const showContent = !isLoading && items.length > 0;
  const showSkeletons = isLoading;

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm transition-shadow duration-150 hover:shadow-md hover:border-gray-400">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
        <p className="text-xs font-medium text-slate-700">{title}</p>
        {showContent && (
          <div className="flex items-center gap-2 flex-wrap">
            {toolSlug && <ShareButtons toolSlug={toolSlug} items={items} />}
            <ToolCopyButton label="Copy all" onClick={onCopyAll} />
          </div>
        )}
      </div>
      <div className="space-y-3 min-h-[80px]">
        {showSkeletons && (
          <>
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-20 rounded-md bg-gray-200 animate-pulse"
              />
            ))}
          </>
        )}
        {!showSkeletons && items.length === 0 && (
          <p className="text-sm text-slate-500 py-2">{emptyMessage}</p>
        )}
        {showContent &&
          items.map((text, index) => (
            <div
              key={index}
              className="rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm text-slate-800 whitespace-pre-line flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 transition-shadow duration-150 hover:border-gray-400 hover:shadow-md"
            >
              <span className="flex-1">
                <span className="text-slate-500 font-medium mr-2">{index + 1}.</span>
                {text}
              </span>
              <ToolCopyButton
                label="Copy"
                onClick={() => onCopyItem(index)}
              />
            </div>
          ))}
      </div>
    </div>
  );
}
