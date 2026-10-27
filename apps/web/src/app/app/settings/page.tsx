import type { Metadata } from "next";
import { DeleteAccountButton } from "@/components/DeleteAccountButton";
import { FeedbackForm } from "@/components/FeedbackForm";
import { LogoutButton } from "@/components/LogoutButton";
import { SettingsForm } from "@/components/SettingsForm";
import { accountPlan, requireAccount } from "@/lib/auth";
import { formatDate, planLabel } from "@/lib/format";

export const metadata: Metadata = {
  title: "Settings",
};

export default async function SettingsPage() {
  const account = await requireAccount();
  const plan = accountPlan(account);

  return (
    <div className="settings-page">
      <div className="page-top">
        <div>
          <p className="eyebrow">Settings</p>
          <h1>Your agency, your handover.</h1>
          <p className="page-lede">
            The name and accent appear at the top of every client pack. Keep it simple.
          </p>
        </div>
      </div>

      <div className="settings-grid">
        <section>
          <div className="list-head">
            <h2>Pack branding</h2>
          </div>
          <SettingsForm
            agencyName={account.agency_name}
            accent={account.accent}
            logoUrl={account.logo_url}
          />
        </section>

        <aside className="settings-side">
          <div className="panel side-panel">
            <p className="eyebrow">Account</p>
            <dl className="account-list">
              <div>
                <dt>Email</dt>
                <dd>{account.email}</dd>
              </div>
              <div>
                <dt>Plan</dt>
                <dd>
                  <span className={`badge badge-${plan}`}>{planLabel(plan)}</span>
                </dd>
              </div>
              <div>
                <dt>Member since</dt>
                <dd>{formatDate(account.created_at)}</dd>
              </div>
            </dl>
            <p className="microcopy">
              Billing is handled by Lemon Squeezy once Pro checkout opens. No card details touch
              HandoffKit.
            </p>
            <LogoutButton />
          </div>

          <div className="panel side-panel">
            <p className="eyebrow">Feedback</p>
            <h2>What is missing?</h2>
            <p className="muted">
              The next improvement comes from a real handover, not a roadmap vote.
            </p>
            <FeedbackForm compact />
          </div>

          <div className="panel side-panel">
            <p className="eyebrow">Danger zone</p>
            <h2>Delete account</h2>
            <p className="muted">
              This removes your account and every pack. Share links stop working.
            </p>
            <DeleteAccountButton />
          </div>
        </aside>
      </div>
    </div>
  );
}
