import { NextResponse } from "next/server";
import { renderPackPdf, type Pack } from "@handoffkit/core";
import { getAccount } from "@/lib/auth";
import { query } from "@/lib/db";
import { track } from "@/lib/events";
import { jsonError } from "@/lib/http";
import { safeFileName } from "@/lib/validate";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const account = await getAccount();
  if (!account) return jsonError("Sign in first.", 401);
  const { id } = await context.params;

  const rows = await query<{ pack_json: Pack; pack_name: string }>(
    `select pack_json, pack_name from handoffkit.packs where id = $1 and account_id = $2 limit 1`,
    [id, account.id],
  );
  const row = rows[0];
  if (!row) return jsonError("Pack not found.", 404);

  const bytes = await renderPackPdf(row.pack_json);
  const filename = `${safeFileName(row.pack_name)}-handover.pdf`;
  await track("pdf_downloaded", account.id, { packId: id });

  return new NextResponse(new Uint8Array(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}
