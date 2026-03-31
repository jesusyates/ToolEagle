import type { NextPageContext } from "next";

/**
 * Dev / fallback: App Router 在开发模式下渲染 500 时会跳过 app 的 `/500` 并回退到
 * Pages Router 的 `/_error`。纯 App 项目若无此文件，`findPageComponents("/_error")` 为 null，
 * 浏览器会出现「missing required error components, refreshing...」无限刷新。
 * 见 next/dist/server/base-server.js `renderErrorToResponseImpl`。
 */
export default function LegacyErrorPage({ statusCode }: { statusCode?: number }) {
  return (
    <div className="min-h-[200px] flex flex-col items-center justify-center gap-4 p-8 bg-page text-slate-900">
      <h1 className="text-lg font-semibold">Something went wrong</h1>
      <p className="text-sm text-slate-600">
        {statusCode != null ? `Error ${statusCode}` : "An unexpected error occurred."}
      </p>
      <button
        type="button"
        className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
        onClick={() => window.location.reload()}
      >
        Try again
      </button>
    </div>
  );
}

LegacyErrorPage.getInitialProps = ({ res, err }: NextPageContext) => {
  const fromErr =
    err && typeof err === "object" && "statusCode" in err
      ? Number((err as { statusCode?: number }).statusCode)
      : undefined;
  const statusCode = res?.statusCode ?? fromErr ?? 500;
  return { statusCode };
};
