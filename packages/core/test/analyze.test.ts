import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import {
  analyzeWorkflow,
  parseWorkflow,
  RISKY_WORKFLOW,
  SAMPLE_WORKFLOW,
  WorkflowParseError,
} from "../dist/index.js";

test("parses a plain n8n export", async () => {
  const raw = await readFile(new URL("./fixtures/minimal.json", import.meta.url), "utf8");
  const workflow = parseWorkflow(raw);
  assert.equal(workflow.name, "Minimal workflow");
  assert.equal(workflow.nodes.length, 2);
  assert.equal(workflow.active, false);
});

test("accepts a data wrapper", () => {
  const workflow = parseWorkflow({ data: SAMPLE_WORKFLOW });
  assert.equal(workflow.nodes.length > 5, true);
});

test("rejects malformed input", () => {
  assert.throws(() => parseWorkflow({}), WorkflowParseError);
  assert.throws(() => parseWorkflow("not json"), WorkflowParseError);
  assert.throws(() => parseWorkflow({ nodes: [] }), WorkflowParseError);
});

test("analyses the sample workflow without inventing findings", () => {
  const pack = analyzeWorkflow(SAMPLE_WORKFLOW, {
    clientName: "Northstar Studio",
    agencyName: "Handoff Studio",
    generatedAt: "2026-10-23T00:00:00.000Z",
  });

  assert.equal(pack.clientName, "Northstar Studio");
  assert.equal(pack.agencyName, "Handoff Studio");
  assert.equal(pack.workflow.aiNodeCount, 1);
  assert.equal(pack.workflow.triggerCount, 1);
  assert.equal(pack.workflow.credentialCount, 3);
  assert.equal(pack.aiSystems[0]?.provider, "OpenAI");
  assert.equal(pack.aiSystems[0]?.model, "gpt-4o-mini");
  assert.equal(pack.aiSystems[0]?.canAct, true);
  assert.equal(
    pack.aiSystems[0]?.humanOversight,
    "An approval or review step is present (Wait for approval). Confirm a person owns the gate.",
  );
  assert.equal(pack.readiness, "review");
  assert.equal(pack.score, 77);
  assert.equal(pack.findings.some((finding) => finding.code === "webhook_unauthenticated"), true);
  assert.equal(pack.findings.some((finding) => finding.code === "no_error_workflow"), true);
  assert.equal(pack.findings.some((finding) => finding.code === "hardcoded_secret"), false);
  assert.equal(pack.findings.some((finding) => finding.code === "personal_data_to_ai"), false);
  assert.equal(pack.dataCategories.length, 0);
  assert.equal(pack.systems.includes("Google Sheets"), true);
  assert.equal(pack.systems.includes("Gmail"), true);
  assert.equal(pack.systems.includes("Slack"), true);
  assert.equal(pack.steps.length, 10);
  assert.equal(
    pack.summary,
    "Inbound lead qualifier starts from a public webhook request. It has 1 AI step (OpenAI) and runs 10 steps. No personal data categories were detected. 1 high-severity finding needs attention before handover.",
  );
});

test("flags a hardcoded secret without leaking the value", () => {
  const pack = analyzeWorkflow(RISKY_WORKFLOW);
  const serialized = JSON.stringify(pack);
  assert.equal(serialized.includes("sk-proj-REPLACE_WITH_REAL_KEY"), false);
  const secret = pack.findings.find((finding) => finding.code === "hardcoded_secret");
  assert.equal(Boolean(secret), true);
  assert.equal(secret?.blocking, true);
  assert.equal(pack.readiness, "not_ready");
  assert.equal(pack.findings.some((finding) => finding.code === "personal_data_to_ai"), true);
  assert.equal(pack.dataCategories.some((category) => category.key === "email"), true);
  assert.equal(pack.score <= 55, true);
});

test("redacts secret-like values in notes and labels", () => {
  const key = "sk-proj-abcdefghijklmnopqrstuvwxyz123456";
  const pack = analyzeWorkflow({
    name: `Workflow for ${key}`,
    nodes: [
      { name: "Manual", type: "n8n-nodes-base.manualTrigger", parameters: {} },
      {
        name: "Sticky Note",
        type: "n8n-nodes-base.stickyNote",
        parameters: { content: `Use this key: ${key}` },
      },
    ],
    connections: {},
  });
  const serialized = JSON.stringify(pack);
  assert.equal(serialized.includes(key), false);
  assert.equal(pack.notes[0]?.content.includes("[redacted]"), true);
  assert.equal(pack.packName.includes("[redacted]"), true);
});

test("keeps custom names but caps them", () => {
  const pack = analyzeWorkflow(SAMPLE_WORKFLOW, {
    packName: "Northstar handover - October",
    clientName: "x".repeat(200),
    agencyName: "  Handoff Studio  ",
  });
  assert.equal(pack.packName, "Northstar handover - October");
  assert.equal(pack.agencyName, "Handoff Studio");
  assert.equal(pack.clientName.length <= 120, true);
});
