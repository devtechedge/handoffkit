import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "Privacy",
  description: "How HandoffKit handles account, workflow and pack data.",
};

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy policy"
      intro="What HandoffKit collects, why it collects it and what it does not do with your workflow."
    >
      <h2>What we collect</h2>
      <ul>
        <li>Account details: email, agency name, password hash (scrypt) and account timestamps.</li>
        <li>Pack data: the generated pack, Markdown, client name, pack name and source size.</li>
        <li>Usage events: signup, login, pack created, PDF downloaded and subscription changes.</li>
        <li>Leads and feedback you choose to send, including an optional email address.</li>
        <li>Basic technical logs from our hosting and database providers, kept for security and debugging.</li>
      </ul>

      <h2>What we do not collect</h2>
      <ul>
        <li>We do not store the raw n8n workflow after the pack is generated.</li>
        <li>We do not resolve or store credential values. Secret-like values are redacted from the generated pack, but do not paste secrets into a workflow export.</li>
        <li>We do not send workflow data to a model provider. Pack generation is deterministic.</li>
        <li>We do not sell personal data or run advertising trackers.</li>
      </ul>

      <h2>Why we process it</h2>
      <p>
        We use account data to run the service, pack data to show and share the handover, usage
        events to understand activation and fix problems, and leads or feedback to respond to you.
        The legal bases are performing our contract, our legitimate interest in running a safe
        service, and consent where we ask for it.
      </p>

      <h2>Sharing</h2>
      <p>
        A public pack is visible to anyone with the link. Share links are unguessable and marked
        noindex, but you should still review the pack before sending it. We use service providers
        for hosting, database and payments. They process data on our instructions. Lemon Squeezy
        handles payment data when checkout is open; card details do not touch HandoffKit.
      </p>

      <h2>Retention</h2>
      <p>
        Packs stay until you delete them or close your account. Account details stay while the
        account is open. Leads and feedback stay while we need them to respond. Security logs are
        kept for a limited period. Backup copies expire on the provider’s schedule.
      </p>

      <h2>Your choices</h2>
      <p>
        You can delete a pack from the dashboard, correct your agency details in settings, or ask
        us to close the account. Depending on where you live, you may also have rights to access,
        correct, export or object to processing. Use the <a href="/contact">contact page</a> and we
        will respond within a reasonable period.
      </p>

      <h2>Security</h2>
      <p>
        Passwords are hashed with scrypt. Sessions use random tokens stored in HttpOnly cookies.
        Database access is restricted, and we do not log workflow bodies. No service is perfectly
        secure, so keep your password private and tell us if you see a problem.
      </p>

      <h2>Children</h2>
      <p>
        HandoffKit is a business tool and is not intended for anyone under 18. We do not knowingly
        collect data from children.
      </p>

      <h2>Changes and contact</h2>
      <p>
        If this policy changes, we will update the date at the top. For a privacy question, use the
        <a href="/contact">contact page</a>.
      </p>
    </LegalPage>
  );
}
