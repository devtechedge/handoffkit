import { NextResponse } from "next/server";
import { getAccount } from "@/lib/auth";
import { query } from "@/lib/db";
import { track } from "@/lib/events";
import { jsonError, sameOrigin } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  if (!sameOrigin(request)) return jsonError("Invalid origin.", 403);
  const account = await getAccount();
  if (!account) return jsonError("Sign in first.", 401);
  const { id } = await context.params;

  const rows = await query<{ id: string }>(
    `delete from handoffkit.packs where id = $1 and account_id = $2 returning id`,
    [id, account.id],
  );
  if (rows.length === 0) return jsonError("Pack not found.", 404);

  await track("pack_deleted", account.id, {});
  return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
}
