import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { Pack } from "@handoffkit/core";
import { CopyButton } from "@/components/CopyButton";
import { DeletePackButton } from "@/components/DeletePackButton";
import { PackView } from "@/components/PackView";
import { requireAccount } from "@/lib/auth";
import { query } from "@/lib/db";
import { getSiteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Client pack",
};

interface PackRow {
  id: string;
  public_id: string;
  pack_json: Pack;
  created_at: string;
}

export default async function PackPage({ params }: { params: Promise<{ id: string }> }) {
  const account = await requireAccount();
  const { id } = await params;
  const rows = await query<PackRow>(
    `select id, public_id, pack_json, created_at
     from handoffkit.packs where id = $1 and account_id = $2 limit 1`,
    [id, account.id],
  );
  const row = rows[0];
  if (!row) notFound();

  const siteUrl = await getSiteUrl();
  const shareUrl = `${siteUrl}/p/${row.public_id}`;

  return (
    <div className="pack-page">
      <div className="pack-page-bar">
        <a className="text-link" href="/app">
          <span aria-hidden="true">←</span> All packs
        </a>
        <div className="pack-actions">
          <CopyButton value={shareUrl} />
          <a className="btn btn-ghost btn-sm" href={`/p/${row.public_id}`} target="_blank" rel="noreferrer">
            Open share page
          </a>
          <a className="btn btn-ghost btn-sm" href={`/api/packs/${row.id}/pdf`}>
            Download PDF
          </a>
          <a className="btn btn-ghost btn-sm" href={`/api/packs/${row.id}/markdown`}>
            Markdown
          </a>
          <DeletePackButton id={row.id} />
        </div>
      </div>

      <div className="share-strip">
        <span className="share-label">Client share link</span>
        <code>{shareUrl}</code>
        <CopyButton value={shareUrl} label="Copy" />
      </div>

      <PackView pack={row.pack_json} accent={account.accent} />
    </div>
  );
}
