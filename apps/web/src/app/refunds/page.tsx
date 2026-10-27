import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "Refunds",
  description: "HandoffKit refund policy.",
};

export default function RefundsPage() {
  return (
    <LegalPage
      title="Refund policy"
      intro="A simple policy for a small product. Billing is not open yet, so there is nothing to refund today."
    >
      <h2>Before billing opens</h2>
      <p>
        Pro checkout is not live. If you joined the early-access list, you have not been charged.
        When billing opens, the policy below applies to the first paid period.
      </p>

      <h2>First payment</h2>
      <p>
        If Pro does not work for you, contact us within 14 days of your first payment and we will
        refund it. Tell us what failed so we can fix it. We may ask for the account email and the
        payment reference.
      </p>

      <h2>Renewals</h2>
      <p>
        Renewal payments are not refunded by default. Cancel before the renewal date to avoid the
        next charge. If a renewal charge was a mistake, contact us within 7 days and we will review
        it.
      </p>

      <h2>Annual plans</h2>
      <p>
        Annual plans can be refunded within 14 days of the first payment. After that, we do not
        refund the unused months unless the service was unavailable for a sustained period or the
        law requires it.
      </p>

      <h2>Abuse and chargebacks</h2>
      <p>
        We may refuse a refund if an account was used to break the terms, if a pack was shared
        unlawfully, or if a chargeback is already open. Talk to us first. It is faster.
      </p>

      <h2>How to ask</h2>
      <p>
        Use the <a href="/contact">contact page</a> and include the email on the account and the
        payment date. Refunds go back to the original payment method through Lemon Squeezy.
      </p>
    </LegalPage>
  );
}
