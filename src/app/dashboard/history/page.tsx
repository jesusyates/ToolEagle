import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { SiteHeader } from "../../_components/SiteHeader";
import { SiteFooter } from "../../_components/SiteFooter";
import { History } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Generation History | ToolEagle",
  description: "View your AI generation history across all tools."
};

export default async function DashboardHistoryPage() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/dashboard/history");
  }

  const { data: rows } = await supabase
    .from("generation_history")
    .select("id, tool_slug, tool_name, input, items, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(100);

  const history = (rows ?? []).map((r) => ({
    id: r.id,
    toolSlug: r.tool_slug,
    toolName: r.tool_name,
    input: r.input,
    items: (r.items as string[]) ?? [],
    createdAt: new Date(r.created_at).getTime()
  }));

  return (
    <main className="min-h-screen bg-white text-slate-900 flex flex-col">
      <SiteHeader />

      <div className="flex-1">
        <section className="container pt-10 pb-16">
          <div className="flex items-center justify-between gap-4">
            <div>
              <Link
                href="/dashboard"
                className="text-sm font-medium text-sky-600 hover:text-sky-800"
              >
                ← Dashboard
              </Link>
              <div className="flex items-center gap-2 mt-2">
                <History className="h-6 w-6 text-slate-500" />
                <h1 className="text-2xl font-semibold text-slate-900">
                  Generation History
                </h1>
              </div>
              <p className="mt-1 text-sm text-slate-600">
                Your recent AI generations across all tools.
              </p>
            </div>
          </div>

          {history.length === 0 ? (
            <div className="mt-10 rounded-2xl border border-slate-200 bg-slate-50/50 p-12 text-center">
              <p className="text-slate-600 font-medium">No history yet</p>
              <p className="mt-1 text-sm text-slate-500">
                Generate content with any tool to see it here.
              </p>
              <Link
                href="/tools"
                className="mt-4 inline-flex rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700"
              >
                Browse tools
              </Link>
            </div>
          ) : (
            <ul className="mt-8 space-y-4">
              {history.map((h) => (
                <li
                  key={h.id}
                  className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:border-slate-300 transition"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-slate-500">
                        {h.toolName} · {new Date(h.createdAt).toLocaleString()}
                      </p>
                      <p className="mt-1 text-sm text-slate-700 line-clamp-2">
                        {h.input}
                      </p>
                      {h.items.length > 0 && (
                        <p className="mt-2 text-xs text-slate-500 line-clamp-1">
                          {h.items[0]}
                          {h.items.length > 1 ? ` (+${h.items.length - 1} more)` : ""}
                        </p>
                      )}
                    </div>
                    <Link
                      href={`/tools/${h.toolSlug}`}
                      className="shrink-0 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                    >
                      Use again
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <SiteFooter />
    </main>
  );
}
