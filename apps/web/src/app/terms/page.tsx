import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "Terms",
  description: "HandoffKit terms of use.",
};

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of use"
      intro="The rules for using HandoffKit. Plain language, not a substitute for legal advice."
    >
      <h2>1. The service</h2>
      <p>
        HandoffKit turns an exported n8n workflow into a documentation pack for a client handover.
        It is a documentation aid. It does not run, host or monitor the workflow, and it does not
        provide legal, privacy or security advice.
      </p>

      <h2>2. Your account</h2>
      <p>
        You need an account to generate and keep packs. Give accurate details, keep your password
        private and tell us if you think the account has been compromised. You are responsible for
        activity under your account.
      </p>

      <h2>3. Acceptable use</h2>
      <ul>
        <li>Only upload workflows you are allowed to process and share.</li>
        <li>Do not use HandoffKit to break the law, infringe rights or expose another person’s data.</li>
        <li>Do not attempt to access another account, probe the service or bypass rate limits.</li>
        <li>Do not resell the service as your own without a written agreement.</li>
      </ul>

      <h2>4. Client packs and your data</h2>
      <p>
        You keep ownership of the workflow and the generated pack. You give us permission to
        process the workflow to generate the pack and to store the generated pack, Markdown and
        account details so the service can work. The raw workflow is not stored.
      </p>
      <p>
        You are responsible for reviewing a pack before you share it. The pack may contain inferred
        details, and a client-facing document can expose information if it is shared too widely.
      </p>

      <h2>5. Plans and billing</h2>
      <p>
        The free plan includes one pack. Pro is $49 per month or $490 per year, billed through
        Lemon Squeezy when checkout is open. Prices are in US dollars and taxes may apply. You can
        cancel from the billing portal or by contacting us. Access continues until the end of the
        paid period unless a refund is agreed.
      </p>
      <p>
        We may change prices with notice before the next renewal. If you do not agree, cancel
        before the renewal date.
      </p>

      <h2>6. Availability and changes</h2>
      <p>
        The service is provided as is. We aim to keep it available, but we do not promise
        uninterrupted access. We may change features, limits or supported formats. We will not
        remove a pack without notice unless required by law or a security issue.
      </p>

      <h2>7. Liability</h2>
      <p>
        To the extent allowed by law, HandoffKit is not liable for indirect or consequential loss,
        lost profits, lost data or a client dispute arising from a pack. Our total liability for a
        claim is limited to the amount you paid us in the twelve months before the claim.
      </p>

      <h2>8. Termination</h2>
      <p>
        You can stop using the service at any time. We may suspend or close an account that
        breaks these terms, creates a security risk or is used to harm another person. If we close
        an account without cause, we will refund the unused part of a prepaid plan.
      </p>

      <h2>9. Governing law</h2>
      <p>
        These terms are governed by the laws of India. The courts of Mumbai have jurisdiction,
        unless a mandatory consumer law in your country says otherwise.
      </p>

      <h2>10. Contact</h2>
      <p>
        Use the <a href="/contact">contact page</a> for account, billing or security questions.
        Include the email address on your account.
      </p>
    </LegalPage>
  );
}
