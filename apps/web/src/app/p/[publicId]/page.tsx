import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { effectivePlan, type Pack } from "@handoffkit/core";
import { PackView } from "@/components/PackView";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

interface PublicRow {
  public_id: string;
  pack_json: Pack;
  created_at: string;
  agency_name: string;
  accent: string;
  account_plan: string;
  subscription_plan: string | null;
  subscription_status: string | null;
  current_period_end: string | null;
}

const getPublicPack = cache(async (publicId: string): Promise<PublicRow | null> => {
  const rows = await query<PublicRow>(
    `select p.public_id, p.pack_json, p.created_at,
            a.agency_name, a.accent, a.plan as account_plan,
            sub.plan as subscription_plan, sub.status as subscription_status,
            sub.current_period_end
     from handoffkit.packs p
     join handoffkit.accounts a on a.id = p.account_id
     left join handoffkit.subscriptions sub on sub.account_id = a.id
     where p.public_id = $1
     limit 1`,
    [publicId],
  );
  return rows[0] ?? null;
});

export function planForPublicPack(row: PublicRow): "free" | "pro" {
  if (row.subscription_plan) {
    return effectivePlan({
      plan: row.subscription_plan === "pro" ? "pro" : "free",
      status: row.subscription_status ?? "",
      currentPeriodEnd: row.current_period_end,
    });
  }
  return row.account_plan === "pro" ? "pro" : "free";
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ publicId: string }>;
}): Promise<Metadata> {
  const { publicId } = await params;
  const row = await getPublicPack(publicId);
  if (!row) return { title: "Pack not found" };
  return {
    title: `${row.pack_json.packName} | Client handover`,
    description: row.pack_json.summary,
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default async function PublicPackPage({
  params,
}: {
  params: Promise<{ publicId: string }>;
}) {
  const { publicId } = await params;
  const row = await getPublicPack(publicId);
  if (!row) notFound();
  const plan = planForPublicPack(row);

  return (
    <main id="main" className="public-page">
      <header className="public-top">
        <div className="container public-top-inner">
          <span className="public-agency">{row.agency_name}</span>
          <span className="public-label">Client handover</span>
        </div>
      </header>

      <div className="container public-container">
        <PackView pack={row.pack_json} accent={row.accent} />
      </div>

      {plan === "free" && (
        <footer className="public-footer">
          <div className="container public-footer-inner">
            <div>
              <p className="footer-heading">Made with HandoffKit</p>
              <p>Turn an n8n export into a client-ready handover pack.</p>
            </div>
            <a className="btn btn-primary btn-sm" href="/">
              Create your own
            </a>
          </div>
        </footer>
      )}
    </main>
  );
}
