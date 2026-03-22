import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getQuestionLinksByPlatform } from "@/lib/question-hub-data";
import { PLATFORM_NAMES } from "@/lib/keyword-patterns";
import { BASE_URL } from "@/config/site";

const PLATFORMS = ["tiktok", "youtube", "instagram"] as const;
type Platform = (typeof PLATFORMS)[number];

function isPlatform(s: string): s is Platform {
  return PLATFORMS.includes(s as Platform);
}

type Props = { params: Promise<{ platform: string }> };

export async function generateStaticParams() {
  return PLATFORMS.map((platform) => ({ platform }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { platform } = await params;
  if (!isPlatform(platform)) return { title: "Not Found" };
  const name = PLATFORM_NAMES[platform];
  const title = `${name} Questions & Guides | ToolEagle`;
  const url = `${BASE_URL}/questions/${platform}`;
  return {
    title,
    description: `50–200 ${name} question links. How to grow, monetize, and create. Grouped by intent.`,
    openGraph: { title, url },
    alternates: { canonical: url },
    robots: { index: true, follow: true }
  };
}

const INTENT_LABELS: Record<string, string> = {
  "how-to": "How to",
  monetization: "Monetization",
  beginner: "Beginner",
  results: "Results"
};

export default async function QuestionsHubPage({ params }: Props) {
  const { platform } = await params;
  if (!isPlatform(platform)) notFound();

  const links = getQuestionLinksByPlatform(platform);
  const name = PLATFORM_NAMES[platform];

  const byIntent = links.reduce(
    (acc, link) => {
      (acc[link.intent] = acc[link.intent] || []).push(link);
      return acc;
    },
    {} as Record<string, typeof links>
  );

  return (
    <main className="min-h-screen bg-page text-slate-900 p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">{name} Questions & Guides</h1>
      <p className="text-slate-600 mb-8">
        {links.length} question and guide links. Grouped by intent: how-to, monetization, beginner, results.
      </p>

      {(["how-to", "monetization", "beginner", "results"] as const).map((intent) => {
        const items = byIntent[intent] ?? [];
        if (items.length === 0) return null;
        return (
          <section key={intent} className="mb-10">
            <h2 className="text-lg font-semibold mb-4">{INTENT_LABELS[intent]}</h2>
            <ul className="space-y-2">
              {items.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sky-700 hover:underline">
                    {link.label}
                  </Link>
                  {link.lang === "en" && (
                    <span className="text-xs text-slate-500 ml-2">EN</span>
                  )}
                </li>
              ))}
            </ul>
          </section>
        );
      })}

      <nav className="mt-10 pt-6 border-t">
        <Link href="/ai-feed" className="text-sky-700 hover:underline">
          ← AI Feed
        </Link>
        {" · "}
        <Link href="/questions/tiktok" className="text-sky-700 hover:underline">
          TikTok
        </Link>
        {" · "}
        <Link href="/questions/youtube" className="text-sky-700 hover:underline">
          YouTube
        </Link>
        {" · "}
        <Link href="/questions/instagram" className="text-sky-700 hover:underline">
          Instagram
        </Link>
      </nav>
    </main>
  );
}
