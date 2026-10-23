import { randomBytes, randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import {
  analyzeWorkflow,
  canCreatePack,
  renderPackMarkdown,
  WorkflowParseError,
  type Pack,
} from "@handoffkit/core";
import { accountPlan, getAccount } from "@/lib/auth";
import { query } from "@/lib/db";
import { track } from "@/lib/events";
import { contentLength, jsonError, sameOrigin } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";
import { cleanText, workflowBody } from "@/lib/validate";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!sameOrigin(request)) return jsonError("Invalid origin.", 403);
  if (contentLength(request) > 600_000) {
    return jsonError("That workflow is too large. The limit is 512 KB.", 413);
  }

  const account = await getAccount();
  if (!account) return jsonError("Sign in first.", 401);
  if (!(await rateLimit(`pack-create:${account.id}`, 30, 3600))) {
    return jsonError("Too many packs in a short time. Try again later.", 429);
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return jsonError("Invalid JSON body.", 400);
  }

  const clientName = cleanText(body.clientName, 120);
  const packName = cleanText(body.packName, 120);
  const workflow = workflowBody(body.workflow);
  if (!clientName) return jsonError("Enter the client name.", 400);
  if (!workflow) return jsonError("Paste an n8n workflow export or upload a JSON file.", 400);
  const sourceBytes = Buffer.byteLength(workflow, "utf8");

  const existing = await query<{ count: number }>(
    `select count(*)::int as count from handoffkit.packs where account_id = $1`,
    [account.id],
  );
  const currentCount = existing[0]?.count ?? 0;
  const plan = accountPlan(account);
  if (!canCreatePack(plan, currentCount)) {
    return jsonError(
      "The free plan includes one pack. Upgrade to Pro for unlimited client packs.",
      403,
    );
  }

  let pack: Pack;
  try {
    pack = analyzeWorkflow(workflow, {
      clientName,
      packName: packName || undefined,
      agencyName: account.agency_name || "Your agency",
      sourceBytes,
    });
  } catch (error) {
    if (error instanceof WorkflowParseError) return jsonError(error.message, 400);
    return jsonError("Could not analyse that workflow.", 500);
  }

  const projectId = randomUUID();
  const packId = randomUUID();
  const publicId = randomBytes(18).toString("base64url");
  const markdown = renderPackMarkdown(pack);

  try {
    await query(
      `insert into handoffkit.projects (id, account_id, client_name)
       values ($1, $2, $3)`,
      [projectId, account.id, clientName],
    );
    await query(
      `insert into handoffkit.packs
        (id, account_id, project_id, public_id, pack_name, client_name, agency_name,
         source_format, source_bytes, pack_json, markdown)
       values ($1, $2, $3, $4, $5, $6, $7, 'n8n', $8, $9::jsonb, $10)`,
      [
        packId,
        account.id,
        projectId,
        publicId,
        pack.packName,
        pack.clientName,
        pack.agencyName,
        sourceBytes,
        JSON.stringify(pack),
        markdown,
      ],
    );
  } catch {
    return jsonError("Could not save the pack. Try again.", 500);
  }

  await track("pack_created", account.id, {
    score: pack.score,
    readiness: pack.readiness,
    nodes: pack.workflow.nodeCount,
    ai: pack.workflow.aiNodeCount,
  });

  return NextResponse.json(
    { ok: true, id: packId, publicId },
    { headers: { "Cache-Control": "no-store" } },
  );
}
