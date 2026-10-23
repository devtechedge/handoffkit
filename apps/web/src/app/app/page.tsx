import type { Metadata } from "next";
import { packLimit } from "@handoffkit/core";
import { CopyButton } from "@/components/CopyButton";
import { accountPlan, requireAccount } from "@/lib/auth";
import { query } from "@/lib/db";
import { formatDate, planLabel, readinessLabel } from "@/lib/format";
import { getSiteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Your packs",
};

interface PackRow {
  id: string;
  public_id: string;
  pack_name: string;
  client_name: string;
  score: number;
  readiness: "ready" | "review" | "not_ready";
  created_at: string;
}

export default async function DashboardPage() {
  const account = await requireAccount();
  const plan = accountPlan(account);
  const siteUrl = await getSiteUrl();

  const packs = await query<PackRow>(
    `select id, public_id, pack_name, client_name,
            (pack_json->>'score')::int as score,
            pack_json->>'readiness' as readiness,
            created_at
     from handoffkit.packs
     where account_id = $1
     order by created_at desc
     limit 50`,
    [account.id],
  );
  const countRows = await query<{ count: number }>(
    `select count(*)::int as count from handoffkit.packs where account_id = $1`,
    [account.id],
  );
  const count = countRows[0]?.count ?? 0;
  const limit = packLimit(plan);
  const atLimit = limit !== null && count >= limit;

  return (
    <div className="dashboard">
      <div className="page-top">
        <div>
          <p className="eyebrow">Dashboard</p>
          <h1>Client handovers, in one place.</h1>
          <p className="page-lede">
            Generate a pack from an n8n export, then send the share link when the build is ready
            for the client.
          </p>
        </div>
        <a className="btn btn-primary" href="/app/new">
          New client pack
        </a>
      </div>

      <div className="stat-grid">
        <div className="stat-card">
          <span className="stat-label">Packs created</span>
          <strong>{count}</strong>
          <span className="stat-note">
            {limit === null ? "Unlimited on Pro" : `${limit - count} left on Free`}
          </span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Plan</span>
          <strong>{planLabel(plan)}</strong>
          <span className="stat-note">
            {plan === "pro" ? "Unlimited client handovers" : "One free pack"}
          </span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Share pages</span>
          <strong>{packs.filter((pack) => pack.public_id).length}</strong>
          <span className="stat-note">Noindex links for clients</span>
        </div>
      </div>

      {atLimit && (
        <div className="notice notice-warm dashboard-notice">
          <div>
            <strong>You have used your free pack.</strong>
            <p>Upgrade when you need the next client handover. Billing opens with the pilot.</p>
          </div>
          <a className="btn btn-primary btn-sm" href="/pricing">
            See Pro
          </a>
        </div>
      )}

      {packs.length === 0 ? (
        <div className="empty-state panel">
          <p className="eyebrow">No packs yet</p>
          <h2>Start with the next workflow you close.</h2>
          <p>
            Export the n8n JSON, add the client name, and HandoffKit will build the first version
            of the handover. You can edit the workflow and regenerate.
          </p>
          <div className="hero-actions">
            <a className="btn btn-primary" href="/app/new">
              Create your first pack
            </a>
            <a className="btn btn-ghost" href="/demo">
              See the demo first
            </a>
          </div>
        </div>
      ) : (
        <section className="pack-list-section">
          <div className="list-head">
            <h2>Recent packs</h2>
            <span className="count-pill">{count} total</span>
          </div>
          <div className="pack-list">
            {packs.map((pack) => {
              const shareUrl = `${siteUrl}/p/${pack.public_id}`;
              return (
                <article className="pack-card" key={pack.id}>
                  <div className="pack-card-score" aria-label={`Score ${pack.score}`}>
                    {pack.score}
                  </div>
                  <div className="pack-card-main">
                    <div className="pack-card-title">
                      <h3>
                        <a href={`/app/packs/${pack.id}`}>{pack.pack_name}</a>
                      </h3>
                      <span className={`badge badge-${pack.readiness}`}>
                        {readinessLabel(pack.readiness)}
                      </span>
                    </div>
                    <p className="pack-card-meta">
                      {pack.client_name} · {formatDate(pack.created_at)}
                    </p>
                  </div>
                  <div className="pack-card-actions">
                    <a className="btn btn-ghost btn-sm" href={`/p/${pack.public_id}`} target="_blank" rel="noreferrer">
                      Share page
                    </a>
                    <CopyButton value={shareUrl} label="Copy link" />
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
