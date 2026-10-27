import { NextResponse } from "next/server";
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

  const rows = await query<{ markdown: string; pack_name: string }>(
    `select markdown, pack_name from handoffkit.packs where id = $1 and account_id = $2 limit 1`,
    [id, account.id],
  );
  const row = rows[0];
  if (!row) return jsonError("Pack not found.", 404);

  await track("markdown_downloaded", account.id, { packId: id });
  return new NextResponse(row.markdown, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Disposition": `attachment; filename="${safeFileName(row.pack_name)}-handover.md"`,
      "Cache-Control": "no-store",
    },
  });
}
