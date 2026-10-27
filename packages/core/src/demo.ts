export const SAMPLE_WORKFLOW = {
  name: "Inbound lead qualifier",
  active: true,
  nodes: [
    {
      id: "note-1",
      name: "Agency note",
      type: "n8n-nodes-base.stickyNote",
      position: [-80, -80],
      parameters: {
        content:
          "Client: Northstar Studio. Owner: Priya. Scores inbound leads, asks a human to approve hot ones, then saves the result and pings sales.",
      },
    },
    {
      id: "webhook-1",
      name: "New lead",
      type: "n8n-nodes-base.webhook",
      typeVersion: 2,
      position: [0, 0],
      parameters: {
        path: "inbound-lead",
        httpMethod: "POST",
        authentication: "none",
        responseMode: "onReceived",
      },
    },
    {
      id: "set-1",
      name: "Normalize lead",
      type: "n8n-nodes-base.set",
      typeVersion: 3,
      position: [220, 0],
      parameters: {
        assignments: {
          assignments: [
            { name: "company", value: "={{ $json.company }}", type: "string" },
            { name: "message", value: "={{ $json.message }}", type: "string" },
            { name: "source", value: "website", type: "string" },
          ],
        },
      },
    },
    {
      id: "http-1",
      name: "Enrich company",
      type: "n8n-nodes-base.httpRequest",
      typeVersion: 4,
      position: [440, 0],
      retryOnFail: true,
      maxTries: 3,
      waitBetweenTries: 2000,
      parameters: {
        requestMethod: "POST",
        url: "https://api.example.com/company/enrich",
        options: { timeout: 10000 },
        sendBody: true,
        bodyParameters: {
          parameters: [{ name: "company", value: "={{ $json.company }}" }],
        },
      },
    },
    {
      id: "ai-1",
      name: "Score lead",
      type: "@n8n/n8n-nodes-langchain.openAi",
      typeVersion: 1.8,
      position: [660, 0],
      onError: "continueErrorOutput",
      parameters: {
        model: { mode: "list", value: "gpt-4o-mini" },
        messages: {
          values: [
            {
              content:
                "You score B2B leads from 1 to 100. Return JSON with score and a one-sentence reason. Lead: {{ $json.message }}",
            },
          ],
        },
        options: { temperature: 0.2, maxTokens: 200 },
      },
    },
    {
      id: "if-1",
      name: "Hot lead?",
      type: "n8n-nodes-base.if",
      typeVersion: 2.2,
      position: [880, 0],
      parameters: {
        conditions: {
          options: { caseSensitive: true, leftValue: "", typeValidation: "strict" },
          conditions: [
            {
              leftValue: "={{ $json.score }}",
              rightValue: 70,
              operator: { type: "number", operation: "gte" },
            },
          ],
          combinator: "and",
        },
      },
    },
    {
      id: "wait-1",
      name: "Wait for approval",
      type: "n8n-nodes-base.wait",
      typeVersion: 1.1,
      position: [1100, -120],
      parameters: { resume: "webhook", amount: 1, unit: "hours" },
    },
    {
      id: "sheets-1",
      name: "Save hot lead",
      type: "n8n-nodes-base.googleSheets",
      typeVersion: 4.5,
      position: [1320, -120],
      parameters: {
        operation: "append",
        sheetName: "Leads",
        columns: {
          mappingMode: "defineBelow",
          value: {
            company: "={{ $json.company }}",
            score: "={{ $json.score }}",
            summary: "={{ $json.reason }}",
          },
        },
      },
      credentials: { googleSheetsOAuth2Api: { id: "cred-1", name: "Northstar Google" } },
    },
    {
      id: "gmail-1",
      name: "Notify sales",
      type: "n8n-nodes-base.gmail",
      typeVersion: 2.1,
      position: [1540, -120],
      parameters: {
        operation: "send",
        to: "={{ $env.SALES_EMAIL }}",
        subject: "Hot lead: {{ $json.company }}",
        message: "Score: {{ $json.score }}. {{ $json.reason }}",
      },
      credentials: { gmailOAuth2: { id: "cred-2", name: "Northstar Gmail" } },
    },
    {
      id: "slack-1",
      name: "Ping channel",
      type: "n8n-nodes-base.slack",
      typeVersion: 2.3,
      position: [1760, -120],
      parameters: {
        operation: "post",
        channel: "#sales",
        text: "Hot lead: {{ $json.company }} ({{ $json.score }})",
      },
      credentials: { slackApi: { id: "cred-3", name: "Northstar Slack" } },
    },
    {
      id: "sheets-2",
      name: "Save cold lead",
      type: "n8n-nodes-base.googleSheets",
      typeVersion: 4.5,
      position: [1100, 160],
      parameters: {
        operation: "append",
        sheetName: "Nurture",
        columns: {
          mappingMode: "defineBelow",
          value: {
            company: "={{ $json.company }}",
            score: "={{ $json.score }}",
            summary: "={{ $json.reason }}",
          },
        },
      },
      credentials: { googleSheetsOAuth2Api: { id: "cred-1", name: "Northstar Google" } },
    },
  ],
  connections: {
    "New lead": { main: [[{ node: "Normalize lead", type: "main", index: 0 }]] },
    "Normalize lead": { main: [[{ node: "Enrich company", type: "main", index: 0 }]] },
    "Enrich company": { main: [[{ node: "Score lead", type: "main", index: 0 }]] },
    "Score lead": { main: [[{ node: "Hot lead?", type: "main", index: 0 }]] },
    "Hot lead?": {
      main: [
        [{ node: "Wait for approval", type: "main", index: 0 }],
        [{ node: "Save cold lead", type: "main", index: 0 }],
      ],
    },
    "Wait for approval": { main: [[{ node: "Save hot lead", type: "main", index: 0 }]] },
    "Save hot lead": { main: [[{ node: "Notify sales", type: "main", index: 0 }]] },
    "Notify sales": { main: [[{ node: "Ping channel", type: "main", index: 0 }]] },
  },
  settings: {
    executionOrder: "v1",
    timezone: "Asia/Kolkata",
    saveDataSuccessExecution: "none",
    saveDataErrorExecution: "all",
    executionTimeout: 300,
  },
  tags: [{ name: "sales" }, { name: "ai" }],
} as const;

export const RISKY_WORKFLOW = {
  ...SAMPLE_WORKFLOW,
  name: "Inbound lead qualifier (risky copy)",
  nodes: SAMPLE_WORKFLOW.nodes.map((node) => {
    if (node.name === "Enrich company") {
      return {
        ...node,
        parameters: {
          ...node.parameters,
          headerParameters: {
            parameters: [
              {
                name: "x-api-key",
                value: "sk-proj-REPLACE_WITH_REAL_KEY_000000000000",
              },
            ],
          },
        },
      };
    }
    if (node.name === "Normalize lead") {
      return {
        ...node,
        parameters: {
          ...node.parameters,
          assignments: {
            assignments: [
              { name: "email", value: "={{ $json.email }}", type: "string" },
              { name: "company", value: "={{ $json.company }}", type: "string" },
              { name: "message", value: "={{ $json.message }}", type: "string" },
            ],
          },
        },
      };
    }
    if (node.name === "Score lead") {
      return { ...node, onError: undefined };
    }
    return node;
  }),
  settings: {
    ...SAMPLE_WORKFLOW.settings,
    saveDataSuccessExecution: "all",
    executionTimeout: undefined,
    timezone: undefined,
    errorWorkflow: undefined,
  },
} as const;

export function sampleWorkflowJson(): string {
  return JSON.stringify(SAMPLE_WORKFLOW, null, 2);
}

export function riskyWorkflowJson(): string {
  return JSON.stringify(RISKY_WORKFLOW, null, 2);
}
