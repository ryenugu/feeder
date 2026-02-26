import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy – Feeder",
  description: "Privacy Policy for the Feeder recipe aggregator app.",
};

const EFFECTIVE_DATE = "February 26, 2026";
const CONTACT_EMAIL = "support@feeder.app";

export default function PrivacyPage() {
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
          <h2 className="mt-3 text-2xl font-semibold">Privacy Policy</h2>
          <p className="mt-2 text-sm text-muted">Effective: {EFFECTIVE_DATE}</p>
        </header>

        <div className="space-y-8 text-sm leading-relaxed">
          <Section title="1. Overview">
            <p>
              Feeder is a personal recipe aggregator for families. We collect only the
              information needed to make the App work. We do not sell your data, serve ads,
              or share your information with third parties except as described below.
            </p>
          </Section>

          <Section title="2. Information We Collect">
            <Subsection title="Account Information">
              <p>
                When you sign up, we collect your <strong>email address</strong> and a
                hashed password via Supabase Auth. We do not store your password in plain
                text.
              </p>
            </Subsection>

            <Subsection title="Recipes & Content">
              <p>For each recipe you save, we store:</p>
              <ul className="mt-1.5 list-disc space-y-1 pl-5">
                <li>Title, source URL, and cover image URL</li>
                <li>Ingredients and instructions (extracted or manually entered)</li>
                <li>Cook time, servings, tags, and personal notes</li>
              </ul>
            </Subsection>

            <Subsection title="Meal Plans & Grocery Lists">
              <p>
                We store your planned meals by date and meal type (breakfast, lunch, dinner,
                snack), and your grocery list items including store name and checked status.
              </p>
            </Subsection>

            <Subsection title="Family Data">
              <p>
                If you use Family Sharing, we store your family membership, any invite codes
                you generate, and the email addresses of members in your family group. Family
                members can see each other's email addresses within the App.
              </p>
            </Subsection>

            <Subsection title="API Keys">
              <p>
                If you use iOS Shortcuts integration, we store API keys linked to your
                account. These keys are visible to you once and then stored securely. We log
                API key usage to detect abuse.
              </p>
            </Subsection>

            <Subsection title="Usage & Technical Data">
              <p>
                We may collect standard server logs (IP address, request timestamps, browser
                or app version) to operate and secure the service. We do not use third-party
                analytics trackers.
              </p>
            </Subsection>
          </Section>

          <Section title="3. How We Use Your Information">
            <ul className="list-disc space-y-1.5 pl-5">
              <li>To create and maintain your account and authenticate you.</li>
              <li>
                To store, display, and sync your recipes, meal plans, and grocery lists
                across devices and with your family member.
              </li>
              <li>
                To power AI features — when you request recipe suggestions or auto-extraction,
                relevant content (recipe URL, ingredients) is sent to Anthropic's API. See
                §5 for details.
              </li>
              <li>To send transactional emails (e.g., email confirmation, family invites).</li>
              <li>To detect and prevent abuse, fraud, or unauthorized API key usage.</li>
            </ul>
          </Section>

          <Section title="4. Data Sharing">
            <p>We share your data only with the following parties:</p>
            <table className="mt-3 w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="pb-2 font-semibold">Party</th>
                  <th className="pb-2 font-semibold">Purpose</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                <TableRow
                  party="Supabase"
                  purpose="Database hosting, authentication, and row-level security. Data is stored in the EU (or US) region."
                />
                <TableRow
                  party="Anthropic"
                  purpose="AI recipe extraction and suggestions. Only the recipe URL and/or ingredient list is sent; no account-identifying data."
                />
                <TableRow
                  party="Vercel"
                  purpose="App hosting and serverless function execution. Standard request metadata is processed."
                />
                <TableRow
                  party="Your family member"
                  purpose="Shared recipes, meal plans, grocery lists, and your email address are visible to the one other member in your family group."
                />
              </tbody>
            </table>
            <p className="mt-3">
              We do not sell, rent, or otherwise share your personal data with advertisers or
              data brokers.
            </p>
          </Section>

          <Section title="5. AI Features">
            <p>
              Feeder uses Anthropic Claude to help extract structured recipe data from URLs
              and to generate meal suggestions. When you trigger an AI feature:
            </p>
            <ul className="mt-2 list-disc space-y-1.5 pl-5">
              <li>
                The recipe URL and/or a portion of recipe text is sent to Anthropic's API.
              </li>
              <li>
                Anthropic processes this data under their own{" "}
                <a
                  href="https://www.anthropic.com/legal/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Privacy Policy
                </a>
                .
              </li>
              <li>
                We do not send your name, email, or account ID to Anthropic.
              </li>
              <li>
                AI-generated content is stored in your account once produced.
              </li>
            </ul>
          </Section>

          <Section title="6. Data Security">
            <p>
              We use industry-standard safeguards including:
            </p>
            <ul className="mt-2 list-disc space-y-1.5 pl-5">
              <li>TLS encryption for all data in transit.</li>
              <li>Supabase Row Level Security (RLS) to ensure you can only access your own data (and your family member's shared data).</li>
              <li>Hashed passwords — we never store or see your password in plain text.</li>
              <li>Scoped API keys for iOS Shortcuts access.</li>
            </ul>
            <p className="mt-2">
              No system is 100% secure. If you discover a vulnerability, please contact us at{" "}
              <EmailLink email={CONTACT_EMAIL} />.
            </p>
          </Section>

          <Section title="7. Your Rights & Choices">
            <ul className="list-disc space-y-1.5 pl-5">
              <li>
                <strong>Access & Export:</strong> You can view all your recipes, meal plans,
                and grocery lists within the App at any time.
              </li>
              <li>
                <strong>Correction:</strong> You can edit any recipe or account information
                directly in the App.
              </li>
              <li>
                <strong>Deletion:</strong> Deleting your account removes all your personal
                data from our systems within 30 days, except where retention is required by
                law. Shared recipes will be removed from your family member's view.
              </li>
              <li>
                <strong>Family:</strong> You can leave your family group at any time from
                the Profile page. Your personal favorites and account data remain yours.
              </li>
              <li>
                <strong>API Keys:</strong> You can revoke API keys at any time from Profile
                → iOS Shortcuts.
              </li>
            </ul>
          </Section>

          <Section title="8. Data Retention">
            <p>
              We retain your data for as long as your account is active. If you delete your
              account, we will purge your personal data within 30 days. Server logs are
              retained for up to 90 days for security purposes.
            </p>
          </Section>

          <Section title="9. Children">
            <p>
              Feeder is not directed at children under 13. If you believe a child under 13
              has created an account, please contact us at{" "}
              <EmailLink email={CONTACT_EMAIL} /> and we will delete the account promptly.
            </p>
          </Section>

          <Section title="10. Changes to This Policy">
            <p>
              We may update this policy as the App evolves. We will post the updated policy
              here and update the effective date. Material changes will be communicated via
              email or an in-app notice.
            </p>
          </Section>

          <Section title="11. Contact">
            <p>
              If you have questions or requests about your privacy, email us at{" "}
              <EmailLink email={CONTACT_EMAIL} />.
            </p>
          </Section>
        </div>

        <footer className="mt-12 border-t border-border pt-6 flex flex-wrap gap-4 text-xs text-muted">
          <Link href="/terms" className="hover:text-foreground transition-colors">
            Terms of Service
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
      <div className="text-muted space-y-3">{children}</div>
    </section>
  );
}

function Subsection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h4 className="mb-1.5 font-medium text-foreground">{title}</h4>
      {children}
    </div>
  );
}

function TableRow({ party, purpose }: { party: string; purpose: string }) {
  return (
    <tr>
      <td className="py-2 pr-4 font-medium text-foreground align-top whitespace-nowrap">
        {party}
      </td>
      <td className="py-2">{purpose}</td>
    </tr>
  );
}

function EmailLink({ email }: { email: string }) {
  return (
    <a href={`mailto:${email}`} className="text-primary hover:underline">
      {email}
    </a>
  );
}
