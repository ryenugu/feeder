import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service – Feeder",
  description: "Terms of Service for the Feeder recipe aggregator app.",
};

const EFFECTIVE_DATE = "February 26, 2026";
const CONTACT_EMAIL = "support@feeder.app";

export default function TermsPage() {
  return (
    <div className="min-h-dvh bg-background px-4 py-12 safe-x">
      <div className="mx-auto max-w-2xl">
        <Link
          href="/login"
          className="mb-8 inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground transition-colors"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </Link>

        <header className="mb-10">
          <h1 className="text-3xl font-bold text-primary">feeder</h1>
          <h2 className="mt-3 text-2xl font-semibold">Terms of Service</h2>
          <p className="mt-2 text-sm text-muted">Effective: {EFFECTIVE_DATE}</p>
        </header>

        <div className="space-y-8 text-sm leading-relaxed">
          <Section title="1. Acceptance of Terms">
            <p>
              By creating an account or using Feeder ("the App", "we", "us"), you agree to
              these Terms of Service. If you do not agree, do not use the App. We may update
              these terms at any time; continued use after changes constitutes acceptance.
            </p>
          </Section>

          <Section title="2. What Feeder Does">
            <p>
              Feeder is a personal recipe aggregator designed for small family use. It lets
              you save, organize, and share recipes extracted from external URLs; plan weekly
              meals; and manage a shared grocery list — all in one clean, ad-free space.
            </p>
          </Section>

          <Section title="3. Accounts & Eligibility">
            <ul className="list-disc space-y-1.5 pl-5">
              <li>You must be at least 13 years old to create an account.</li>
              <li>
                You are responsible for keeping your login credentials secure. Notify us
                immediately at{" "}
                <EmailLink email={CONTACT_EMAIL} /> if you suspect unauthorized access.
              </li>
              <li>
                One account per person. You may not share your account with others; instead,
                use the Family feature to collaborate.
              </li>
            </ul>
          </Section>

          <Section title="4. Family Sharing">
            <p>
              Feeder supports a two-person family group. When you join or invite someone to
              your family:
            </p>
            <ul className="mt-2 list-disc space-y-1.5 pl-5">
              <li>
                Both members can view and interact with shared recipes, meal plans, and
                grocery lists.
              </li>
              <li>
                Personal favorites remain private to each member.
              </li>
              <li>
                Your email address may be visible to your family member for attribution
                purposes.
              </li>
              <li>
                Family memberships are limited to two (2) members at a time. Leaving a
                family is permanent and cannot be undone automatically.
              </li>
            </ul>
          </Section>

          <Section title="5. Recipe Content & Third-Party Sources">
            <ul className="list-disc space-y-1.5 pl-5">
              <li>
                Feeder extracts recipe data from URLs you provide. We do not host or own
                that content — all rights remain with the original publishers.
              </li>
              <li>
                We store a cleaned-up copy of the recipe (ingredients, instructions, images)
                to give you a consistent, clutter-free experience. This is intended for
                personal, non-commercial use.
              </li>
              <li>
                You are responsible for ensuring you have the right to save and use recipes
                for your personal household. Do not use Feeder to republish or commercially
                exploit third-party content.
              </li>
              <li>
                We use AI (powered by Anthropic Claude) to generate recipe suggestions and
                assist with extraction. AI-generated content may not always be accurate;
                always verify ingredients and instructions before cooking.
              </li>
            </ul>
          </Section>

          <Section title="6. Acceptable Use">
            <p>You agree not to:</p>
            <ul className="mt-2 list-disc space-y-1.5 pl-5">
              <li>Use Feeder for any commercial purpose or on behalf of a business.</li>
              <li>Attempt to scrape, reverse-engineer, or abuse the App's API or AI features.</li>
              <li>Upload or link to content that is illegal, harmful, or infringes on others' rights.</li>
              <li>Circumvent account limits, family caps, or other restrictions.</li>
              <li>Interfere with the security or performance of the App.</li>
            </ul>
          </Section>

          <Section title="7. iOS Shortcuts & API Keys">
            <p>
              Feeder offers API keys that allow iOS Shortcuts to save recipes directly from
              your device. These keys are tied to your account and grant the same access as
              being logged in. Keep your API key secret and rotate it if you believe it has
              been compromised. We are not responsible for actions taken using your API key.
            </p>
          </Section>

          <Section title="8. Service Availability">
            <p>
              Feeder is provided as-is and as-available. We do not guarantee uninterrupted
              or error-free service. We may suspend, modify, or discontinue the App at any
              time with reasonable notice where practicable. We are not liable for any loss
              of data or access resulting from downtime or discontinuation.
            </p>
          </Section>

          <Section title="9. Intellectual Property">
            <p>
              The Feeder name, logo, design, and underlying code are our property. You retain
              ownership of any original content you add (e.g., personal notes on recipes). By
              using the App, you grant us a limited license to store and display your content
              solely to operate the service.
            </p>
          </Section>

          <Section title="10. Disclaimer of Warranties">
            <p>
              Feeder is provided <strong>"as is"</strong> without warranties of any kind,
              express or implied. We disclaim all warranties including merchantability,
              fitness for a particular purpose, and non-infringement. Recipe accuracy,
              nutritional information, and AI suggestions are not guaranteed.
            </p>
          </Section>

          <Section title="11. Limitation of Liability">
            <p>
              To the maximum extent permitted by law, Feeder and its operators shall not be
              liable for any indirect, incidental, special, or consequential damages arising
              from your use of the App, including but not limited to data loss, cooking
              outcomes, or reliance on AI-generated suggestions.
            </p>
          </Section>

          <Section title="12. Termination">
            <p>
              You may delete your account at any time from the Profile page. We may suspend
              or terminate accounts that violate these terms. Upon termination, your data
              will be deleted in accordance with our{" "}
              <Link href="/privacy" className="text-primary hover:underline">
                Privacy Policy
              </Link>
              .
            </p>
          </Section>

          <Section title="13. Governing Law">
            <p>
              These terms are governed by applicable law. Any disputes shall be resolved
              through good-faith negotiation; if unresolved, through binding arbitration or
              the courts of competent jurisdiction.
            </p>
          </Section>

          <Section title="14. Contact">
            <p>
              Questions about these terms? Reach us at{" "}
              <EmailLink email={CONTACT_EMAIL} />.
            </p>
          </Section>
        </div>

        <footer className="mt-12 border-t border-border pt-6 flex flex-wrap gap-4 text-xs text-muted">
          <Link href="/privacy" className="hover:text-foreground transition-colors">
            Privacy Policy
          </Link>
          <Link href="/login" className="hover:text-foreground transition-colors">
            Back to App
          </Link>
        </footer>
      </div>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h3 className="mb-3 font-semibold text-base">{title}</h3>
      <div className="text-muted space-y-2">{children}</div>
    </section>
  );
}

function EmailLink({ email }: { email: string }) {
  return (
    <a href={`mailto:${email}`} className="text-primary hover:underline">
      {email}
    </a>
  );
}
