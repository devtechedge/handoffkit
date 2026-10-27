import type { Metadata } from "next";
import { canCreatePack, packLimit, riskyWorkflowJson, sampleWorkflowJson } from "@handoffkit/core";
import { PackForm } from "@/components/PackForm";
import { accountPlan, requireAccount } from "@/lib/auth";
import { query } from "@/lib/db";

export const metadata: Metadata = {
  title: "New client pack",
};

export default async function NewPackPage() {
  const account = await requireAccount();
  const plan = accountPlan(account);
  const countRows = await query<{ count: number }>(
    `select count(*)::int as count from handoffkit.packs where account_id = $1`,
    [account.id],
  );
  const count = countRows[0]?.count ?? 0;
  const limit = packLimit(plan);
  const allowed = canCreatePack(plan, count);

  return (
    <div className="new-pack">
      <div className="page-top">
        <div>
          <p className="eyebrow">New pack</p>
          <h1>Turn the export into the handover.</h1>
          <p className="page-lede">
            The client name is the only required detail. Everything else is read from the n8n
            workflow JSON.
          </p>
        </div>
        <a className="btn btn-ghost" href="/app">
          Back to packs
        </a>
      </div>

      {allowed ? (
        <PackForm mode="create" sampleJson={sampleWorkflowJson()} riskyJson={riskyWorkflowJson()} />
      ) : (
        <div className="empty-state panel">
          <p className="eyebrow">Free plan</p>
          <h2>You have used your free pack.</h2>
          <p>
            Free includes one client pack. Pro removes the limit and adds custom branding, PDF and
            Markdown exports, and no HandoffKit footer on the public page.
          </p>
          <div className="hero-actions">
            <a className="btn btn-primary" href="/pricing">
              See Pro
            </a>
            <a className="btn btn-ghost" href="/app">
              Back to your packs
            </a>
          </div>
          <p className="microcopy">
            Current plan: {plan === "pro" ? "Pro" : "Free"}. Packs used: {count}
            {limit === null ? "" : ` of ${limit}`}.
          </p>
        </div>
      )}
    </div>
  );
}
