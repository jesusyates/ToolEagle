import { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "../_components/SiteHeader";
import { SiteFooter } from "../_components/SiteFooter";
import { SITE_URL, CONTACT_EMAIL } from "@/config/site";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "ToolEagle Privacy Policy. How we collect, use, and protect your data. GDPR and CCPA compliant.",
  openGraph: {
    title: "Privacy Policy | ToolEagle",
    description: "How we collect, use, and protect your data.",
    url: `${SITE_URL}/privacy`
  }
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-white text-slate-900 flex flex-col">
      <SiteHeader />

      <article className="flex-1 container py-12 max-w-3xl">
        <h1 className="text-3xl font-semibold text-slate-900 mb-6">Privacy Policy</h1>
        <p className="text-sm text-slate-500 mb-8">Last updated: March 2026</p>

        <div className="prose prose-slate max-w-none space-y-6 text-slate-700">
          <section>
            <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-3">1. Introduction</h2>
            <p>
              ToolEagle (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) respects your privacy. This Privacy Policy
              explains how we collect, use, disclose, and safeguard your information when you use our
              website and services. We comply with the General Data Protection Regulation (GDPR) and
              the California Consumer Privacy Act (CCPA) where applicable.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-3">2. Information We Collect</h2>
            <p>We may collect:</p>
            <ul className="list-disc ml-6 mt-2 space-y-1">
              <li><strong>Usage data:</strong> Pages visited, tools used, timestamps (via analytics)</li>
              <li><strong>Device data:</strong> Browser type, IP address (anonymized where possible)</li>
              <li><strong>Voluntary data:</strong> Email (if you subscribe to our newsletter), content you submit</li>
              <li><strong>Cookies:</strong> Essential and analytics cookies (see Cookie Policy below)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-3">3. How We Use Your Information</h2>
            <p>We use collected information to:</p>
            <ul className="list-disc ml-6 mt-2 space-y-1">
              <li>Provide and improve our tools and services</li>
              <li>Send newsletters (only if you opt in)</li>
              <li>Analyze usage to improve user experience</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-3">4. Legal Basis (GDPR)</h2>
            <p>
              For users in the EEA/UK, we process data based on: (a) your consent, (b) performance
              of a contract, (c) our legitimate interests (e.g., analytics), or (d) legal obligation.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-3">5. Your Rights (GDPR & CCPA)</h2>
            <p>You have the right to:</p>
            <ul className="list-disc ml-6 mt-2 space-y-1">
              <li><strong>Access</strong> your personal data</li>
              <li><strong>Rectify</strong> inaccurate data</li>
              <li><strong>Erase</strong> your data (&quot;right to be forgotten&quot;)</li>
              <li><strong>Restrict</strong> or object to processing</li>
              <li><strong>Data portability</strong></li>
              <li><strong>Withdraw consent</strong> at any time</li>
              <li>California residents: <strong>Opt out</strong> of sale of personal information (we do not sell data)</li>
            </ul>
            <p className="mt-3">
              To exercise these rights, contact us at{" "}
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-sky-600 hover:underline">
                {CONTACT_EMAIL}
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-3">6. Data Retention</h2>
            <p>
              We retain data only as long as necessary for the purposes described or as required by law.
              Analytics data is typically anonymized or deleted within 24 months.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-3">7. Third-Party Services</h2>
            <p>
              We use Plausible Analytics (privacy-friendly), Sentry (error tracking), and Supabase
              (database). These providers have their own privacy policies and may process data
              outside the EU. We use standard contractual clauses where applicable.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-3">8. Cookies</h2>
            <p>
              We use essential cookies (required for the site to function) and optional analytics
              cookies. You can manage your preferences via our cookie consent banner.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-3">9. Contact</h2>
            <p>
              For privacy-related questions:{" "}
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-sky-600 hover:underline">
                {CONTACT_EMAIL}
              </a>
            </p>
          </section>
        </div>

        <div className="mt-12 pt-6 border-t border-slate-200">
          <Link href="/terms" className="text-sky-600 hover:underline">
            View Terms of Service →
          </Link>
        </div>
      </article>

      <SiteFooter />
    </main>
  );
}
