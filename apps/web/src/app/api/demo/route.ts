import { NextResponse } from "next/server";
import { analyzeWorkflow, WorkflowParseError } from "@handoffkit/core";
import { track } from "@/lib/events";
import { clientIp, contentLength, hashKey, jsonError } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";
import { workflowBody } from "@/lib/validate";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (contentLength(request) > 600_000) {
    return jsonError("That workflow is too large for the demo. The limit is 512 KB.", 413);
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return jsonError("Invalid JSON body.", 400);
  }

  const workflow = workflowBody(body.workflow);
  if (!workflow) {
    return jsonError("Paste an n8n workflow export or load the sample.", 400);
  }

  const ip = hashKey(clientIp(request));
  if (!(await rateLimit(`demo:${ip}`, 40, 3600))) {
    return jsonError("The demo is rate-limited. Try again later.", 429);
  }

  try {
    const pack = analyzeWorkflow(workflow, {
      clientName: "Sample client",
      agencyName: "Your agency",
      packName: undefined,
      sourceBytes: Buffer.byteLength(workflow, "utf8"),
    });
    await track("demo_generated", null, {
      nodes: pack.workflow.nodeCount,
      ai: pack.workflow.aiNodeCount,
      score: pack.score,
      readiness: pack.readiness,
    });
    return NextResponse.json(
      { ok: true, pack },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    if (error instanceof WorkflowParseError) {
      return jsonError(error.message, 400);
    }
    return jsonError("Could not analyse that workflow. Check the export and try again.", 500);
  }
}
