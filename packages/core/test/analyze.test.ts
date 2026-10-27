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

test("does not flag a placeholder bearer token as a hardcoded secret", () => {
  const pack = analyzeWorkflow({
    name: "Placeholder token",
    nodes: [
      { name: "Manual", type: "n8n-nodes-base.manualTrigger", parameters: {} },
      {
        name: "Fetch Crunchbase",
        type: "n8n-nodes-base.httpRequest",
        parameters: {
          url: "https://api.crunchbase.com/api/v4/searches/organizations",
          headerParameters: {
            parameters: [{ name: "Authorization", value: "Bearer YOUR_CRUNCHBASE_API_KEY" }],
          },
        },
      },
    ],
    connections: {},
  });
  assert.equal(pack.findings.some((finding) => finding.code === "hardcoded_secret"), false);
});

test("does not count an error trigger as an entry point", () => {
  const pack = analyzeWorkflow({
    name: "Scheduled sync",
    nodes: [
      { name: "Daily", type: "n8n-nodes-base.scheduleTrigger", parameters: {} },
      { name: "Error Handler", type: "n8n-nodes-base.errorTrigger", parameters: {} },
    ],
    connections: {},
  });
  assert.equal(pack.workflow.triggerCount, 1);
  assert.equal(pack.summary.startsWith("Scheduled sync starts from a schedule."), true);
  assert.equal(pack.findings.some((finding) => finding.code === "multiple_triggers"), false);
});

test("does not treat a Slack escalation as an approval gate", () => {
  const pack = analyzeWorkflow({
    name: "Support agent",
    nodes: [
      { name: "Chat", type: "n8n-nodes-base.chatTrigger", parameters: {} },
      {
        name: "Support Agent",
        type: "@n8n/n8n-nodes-langchain.agent",
        parameters: { model: "gpt-4o-mini" },
      },
      { name: "Send Gmail Response", type: "n8n-nodes-base.gmail", parameters: {} },
      { name: "Slack Human Escalation", type: "n8n-nodes-base.slack", parameters: {} },
    ],
    connections: {
      Chat: { main: [[{ node: "Support Agent", type: "main", index: 0 }]] },
      "Support Agent": { main: [[{ node: "Send Gmail Response", type: "main", index: 0 }]] },
    },
  });
  assert.equal(pack.aiSystems[0]?.humanOversight, "No explicit approval step detected.");
  assert.equal(
    pack.findings.some((finding) => finding.code === "ai_can_act_without_approval"),
    true,
  );
});

test("counts AI steps separately from model resources and resolves a connected model", () => {
  const pack = analyzeWorkflow({
    name: "Chain with model",
    nodes: [
      { name: "Manual", type: "n8n-nodes-base.manualTrigger", parameters: {} },
      {
        name: "Gemini",
        type: "@n8n/n8n-nodes-langchain.lmChatGoogleGemini",
        parameters: { modelName: "models/gemini-2.0-flash" },
      },
      { name: "Write email", type: "@n8n/n8n-nodes-langchain.chainLlm", parameters: {} },
      { name: "Send", type: "n8n-nodes-base.gmail", parameters: {} },
    ],
    connections: {
      Manual: { main: [[{ node: "Write email", type: "main", index: 0 }]] },
      Gemini: { ai_languageModel: [[{ node: "Write email", type: "ai_languageModel", index: 0 }]] },
      "Write email": { main: [[{ node: "Send", type: "main", index: 0 }]] },
    },
  });
  assert.equal(pack.workflow.aiNodeCount, 1);
  assert.equal(pack.aiSystems.length, 1);
  assert.equal(pack.aiSystems[0]?.provider, "Google");
  assert.equal(pack.aiSystems[0]?.model, "models/gemini-2.0-flash");
  assert.equal(pack.summary.includes("1 AI step"), true);
  assert.equal(pack.findings.some((finding) => finding.code === "ai_model_not_in_export"), false);
  const aiErrorFindings = pack.findings.filter(
    (finding) => finding.code === "ai_without_error_handling",
  );
  assert.equal(aiErrorFindings.length, 1);
  assert.equal(aiErrorFindings[0]?.node, "Write email");
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
