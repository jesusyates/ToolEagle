import { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "../_components/SiteHeader";
import { SiteFooter } from "../_components/SiteFooter";
import { SITE_URL, CONTACT_EMAIL } from "@/config/site";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "ToolEagle Terms of Service. Rules and guidelines for using our free creator tools.",
  openGraph: {
    title: "Terms of Service | ToolEagle",
    description: "Rules and guidelines for using our free creator tools.",
    url: `${SITE_URL}/terms`
  }
};

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-page text-slate-900 flex flex-col">
      <SiteHeader />

      <article className="flex-1 container py-12 max-w-3xl">
        <h1 className="text-3xl font-semibold text-slate-900 mb-6">Terms of Service</h1>
        <p className="text-sm text-slate-500 mb-8">Last updated: March 2026</p>

        <div className="prose prose-slate max-w-none space-y-6 text-slate-700">
          <section>
            <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-3">1. Acceptance of Terms</h2>
            <p>
              By accessing or using ToolEagle (&quot;the Service&quot;), you agree to be bound by these Terms
              of Service. If you do not agree, do not use the Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-3">2. Description of Service</h2>
            <p>
              ToolEagle provides free AI-powered tools for content creators (captions, hashtags,
              hooks, titles, etc.). We reserve the right to modify, suspend, or discontinue any
              part of the Service at any time.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-3">3. Acceptable Use</h2>
            <p>You agree not to:</p>
            <ul className="list-disc ml-6 mt-2 space-y-1">
              <li>Use the Service for any illegal purpose</li>
              <li>Attempt to bypass security or access restrictions</li>
              <li>Scrape, crawl, or abuse the Service beyond normal use</li>
              <li>Submit harmful, offensive, or infringing content</li>
              <li>Impersonate others or misrepresent your affiliation</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-3">4. Intellectual Property</h2>
            <p>
              Content you generate using our tools is yours. You grant us a limited license to
              display, store, and process your submissions for providing the Service. Our branding,
              logos, and code remain our property.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-3">5. Disclaimer</h2>
            <p>
              The Service is provided &quot;as is&quot; without warranties of any kind. We do not guarantee
              accuracy, availability, or fitness for a particular purpose. AI-generated content may
              require human review.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-3">6. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by law, ToolEagle shall not be liable for any indirect,
              incidental, special, or consequential damages arising from your use of the Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-3">7. Changes</h2>
            <p>
              We may update these Terms. Continued use after changes constitutes acceptance. We will
              notify users of material changes via the website or email where appropriate.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-3">8. Contact</h2>
            <p>
              For questions:{" "}
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-sky-600 hover:underline">
                {CONTACT_EMAIL}
              </a>
            </p>
          </section>
        </div>

        <div className="mt-12 pt-6 border-t border-slate-200">
          <Link href="/privacy" className="text-sky-600 hover:underline">
            View Privacy Policy →
          </Link>
        </div>
      </article>

      <SiteFooter />
    </main>
  );
}
