import { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/app/_components/SiteHeader";
import { SiteFooter } from "@/app/_components/SiteFooter";
import { getAllEnHowToSlugs, getEnHowToContent } from "@/lib/en-how-to-content";
import { BASE_URL } from "@/config/site";

export const metadata: Metadata = {
  title: "Guias How-To para Criadores",
  description:
    "Aprenda a crescer no TikTok, monetizar seu conteúdo e criar títulos para YouTube. Guias gratuitos para criadores.",
  openGraph: {
    title: "Guias How-To para Criadores | ToolEagle",
    description:
      "Aprenda a crescer no TikTok, monetizar seu conteúdo e criar títulos para YouTube.",
    url: `${BASE_URL}/pt/how-to`,
    type: "website"
  }
};

export default function PtHowToHubPage() {
  const slugs = getAllEnHowToSlugs();
  const items = slugs
    .map((slug) => getEnHowToContent(slug))
    .filter((item): item is NonNullable<typeof item> => item !== null);

  return (
    <main className="min-h-screen bg-page text-slate-900 flex flex-col">
      <SiteHeader />

      <div className="flex-1">
        <article className="container py-12">
          <div className="max-w-3xl">
            <nav className="text-sm text-slate-500 mb-6" aria-label="Breadcrumb">
              <Link href="/" className="hover:text-slate-700">
                Início
              </Link>
              <span className="mx-2">/</span>
              <span className="text-slate-900">Guias How-To</span>
            </nav>

            <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-slate-900">
              Guias How-To para Criadores
            </h1>

            <p className="mt-6 text-lg text-slate-700 leading-relaxed">
              Guias práticos para criadores de TikTok, YouTube e Instagram.
              Aumente sua audiência, monetize e crie conteúdo que performa.
            </p>

            <section className="mt-12">
              <h2 className="text-xl font-semibold text-slate-900">Guias</h2>
              <ul className="mt-4 space-y-3">
                {items.map((item) => (
                  <li key={item.slug}>
                    <Link
                      href={`/pt/how-to/${item.slug}`}
                      className="text-sky-700 hover:text-sky-800 hover:underline font-medium"
                    >
                      {item.title}
                    </Link>
                    <p className="text-sm text-slate-600 mt-1">
                      {item.description.slice(0, 120)}…
                    </p>
                  </li>
                ))}
              </ul>
            </section>

            <div className="mt-10">
              <Link
                href="/tools"
                className="text-sm font-medium text-sky-700 hover:text-sky-800 underline-offset-2 hover:underline"
              >
                Ver todas as ferramentas →
              </Link>
            </div>
          </div>
        </article>
      </div>

      <SiteFooter />
    </main>
  );
}
