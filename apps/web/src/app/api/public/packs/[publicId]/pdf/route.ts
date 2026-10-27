import { NextResponse } from "next/server";
import { renderPackPdf, type Pack } from "@handoffkit/core";
import { query } from "@/lib/db";
import { track } from "@/lib/events";
import { clientIp, hashKey, jsonError } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";
import { safeFileName } from "@/lib/validate";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  context: { params: Promise<{ publicId: string }> },
) {
  const { publicId } = await context.params;
  if (!/^[A-Za-z0-9_-]{16,40}$/.test(publicId)) {
    return jsonError("Pack not found.", 404);
  }

  const ip = hashKey(clientIp(request));
  if (!(await rateLimit(`public-pdf:${ip}`, 40, 3600))) {
    return jsonError("Too many downloads. Try again later.", 429);
  }

  const rows = await query<{
    pack_json: Pack;
    pack_name: string;
    account_id: string;
  }>(
    `select pack_json, pack_name, account_id
     from handoffkit.packs where public_id = $1 limit 1`,
    [publicId],
  );
  const row = rows[0];
  if (!row) return jsonError("Pack not found.", 404);

  const bytes = await renderPackPdf(row.pack_json);
  await track("public_pdf_downloaded", row.account_id, { publicId });

  return new NextResponse(new Uint8Array(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${safeFileName(row.pack_name)}-handover.pdf"`,
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}
