import { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/app/_components/SiteHeader";
import { SiteFooter } from "@/app/_components/SiteFooter";
import { getAllEnHowToSlugs, getEnHowToContent } from "@/lib/en-how-to-content";
import { BASE_URL } from "@/config/site";

export const metadata: Metadata = {
  title: "Panduan How-To untuk Kreator",
  description:
    "Pelajari cara berkembang di TikTok, monetisasi konten Anda, dan buat judul YouTube. Panduan gratis untuk kreator.",
  openGraph: {
    title: "Panduan How-To untuk Kreator | ToolEagle",
    description:
      "Pelajari cara berkembang di TikTok, monetisasi konten Anda, dan buat judul YouTube.",
    url: `${BASE_URL}/id/how-to`,
    type: "website"
  }
};

export default function IdHowToHubPage() {
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
                Beranda
              </Link>
              <span className="mx-2">/</span>
              <span className="text-slate-900">Panduan How-To</span>
            </nav>

            <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-slate-900">
              Panduan How-To untuk Kreator
            </h1>

            <p className="mt-6 text-lg text-slate-700 leading-relaxed">
              Panduan praktis untuk kreator TikTok, YouTube, dan Instagram.
              Tingkatkan audiens Anda, monetisasi, dan buat konten yang berhasil.
            </p>

            <section className="mt-12">
              <h2 className="text-xl font-semibold text-slate-900">Panduan</h2>
              <ul className="mt-4 space-y-2">
                {items.map((item) => (
                  <li key={item.slug}>
                    <Link
                      href={`/id/how-to/${item.slug}`}
                      className="block rounded-xl border border-slate-200 bg-white px-4 py-3 text-sky-700 hover:text-sky-800 hover:border-sky-200 hover:bg-sky-50/40 font-medium transition"
                    >
                      {item.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>

            <div className="mt-10">
              <Link
                href="/tools"
                className="text-sm font-medium text-sky-700 hover:text-sky-800 underline-offset-2 hover:underline"
              >
                Lihat semua alat →
              </Link>
            </div>
          </div>
        </article>
      </div>

      <SiteFooter />
    </main>
  );
}
