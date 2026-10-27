import type {
  AiSystem,
  AnalyzeOptions,
  CredentialUse,
  DataCategory,
  Finding,
  N8nNode,
  N8nWorkflow,
  Pack,
  PackNote,
  Readiness,
  Severity,
  TriggerInfo,
  WorkflowStep,
} from "./types.js";
import { WorkflowParseError } from "./types.js";

type JsonRecord = Record<string, unknown>;

interface Leaf {
  path: string;
  key: string;
  value: string | number | boolean;
}

const MAX_NODES = 2000;
const MAX_LEAVES = 8000;

const TRIGGER_TYPES = new Set([
  "n8n-nodes-base.webhook",
  "n8n-nodes-base.scheduleTrigger",
  "n8n-nodes-base.cron",
  "n8n-nodes-base.interval",
  "n8n-nodes-base.manualTrigger",
  "n8n-nodes-base.start",
  "n8n-nodes-base.formTrigger",
  "n8n-nodes-base.chatTrigger",
  "n8n-nodes-base.executeWorkflowTrigger",
  "n8n-nodes-base.errorTrigger",
  "@n8n/n8n-nodes-langchain.chatTrigger",
  "@n8n/n8n-nodes-langchain.mcpTrigger",
]);

const DATA_RULES: Array<{
  key: string;
  label: string;
  sensitive: boolean;
  keyRe: RegExp;
  valueRe?: RegExp;
}> = [
  {
    key: "email",
    label: "Email addresses",
    sensitive: true,
    keyRe: /e-?mail|recipient|mailbox/i,
    valueRe: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i,
  },
  {
    key: "phone",
    label: "Phone numbers",
    sensitive: true,
    keyRe: /phone|mobile|telephone|whatsapp|(^|[._-])tel($|[._-])/i,
    valueRe: /(?:\+?\d[\d\s().-]{7,}\d)/,
  },
  {
    key: "name",
    label: "Names",
    sensitive: true,
    keyRe: /first_?name|last_?name|full_?name|display_?name|customer_?name|contact_?name|person_?name|recipient_?name/i,
  },
  {
    key: "address",
    label: "Postal addresses",
    sensitive: true,
    keyRe: /address|street|postal|zip_?code|(^|[._-])city($|[._-])|(^|[._-])country($|[._-])/i,
  },
  {
    key: "payment",
    label: "Payment or billing data",
    sensitive: true,
    keyRe: /card|iban|account_?number|payment|billing|invoice/i,
  },
  {
    key: "health",
    label: "Health data",
    sensitive: true,
    keyRe: /health|medical|diagnosis|patient|prescription|symptom/i,
  },
  {
    key: "biometric",
    label: "Biometric data",
    sensitive: true,
    keyRe: /biometric|fingerprint|voiceprint|retina|face_?id/i,
  },
  {
    key: "location",
    label: "Location or network identifiers",
    sensitive: true,
    keyRe: /latitude|longitude|(^|[._-])geo($|[._-])|location|ip_?address/i,
    valueRe: /\b(?:\d{1,3}\.){3}\d{1,3}\b/,
  },
  {
    key: "government_id",
    label: "Government identifiers",
    sensitive: true,
    keyRe: /passport|ssn|aadhaar|national_?id|tax_?id|driver_?license/i,
  },
  {
    key: "credentials",
    label: "Credentials or secrets",
    sensitive: true,
    keyRe: /password|api_?key|secret|access_?token|refresh_?token/i,
  },
  {
    key: "financial",
    label: "Financial data",
    sensitive: true,
    keyRe: /salary|income|bank_?account|transaction|balance|credit_?score/i,
  },
  {
    key: "children",
    label: "Data about children",
    sensitive: true,
    keyRe: /child|student|minor|guardian/i,
  },
  {
    key: "tracking",
    label: "Cookies or tracking identifiers",
    sensitive: false,
    keyRe: /cookie|tracking_?id|utm_|device_?id/i,
  },
];

const SECRET_PATTERNS: Array<{ name: string; re: RegExp }> = [
  { name: "OpenAI API key", re: /\bsk-[A-Za-z0-9_-]{20,}\b/ },
  { name: "Anthropic API key", re: /\bsk-ant-[A-Za-z0-9_-]{20,}\b/ },
  { name: "Google API key", re: /\bAIza[0-9A-Za-z_-]{35}\b/ },
  { name: "Slack token", re: /\bxox[baprs]-[A-Za-z0-9-]{10,}\b/ },
  { name: "GitHub token", re: /\bgh[pousr]_[A-Za-z0-9]{30,}\b/ },
  { name: "AWS access key", re: /\bAKIA[0-9A-Z]{16}\b/ },
  { name: "Stripe secret key", re: /\b(?:sk|rk)_live_[0-9A-Za-z]{20,}\b/ },
  { name: "Private key", re: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/ },
  { name: "Bearer token", re: /\bBearer\s+[A-Za-z0-9._~+/-]{20,}=*/ },
  {
    name: "Secret assignment",
    re: /\b(?:api[_-]?key|secret|token|password)\b\s*[:=]\s*["']?[A-Za-z0-9._~+/-]{12,}/i,
  },
];

function redactString(value: string): string {
  let result = value;
  for (const pattern of SECRET_PATTERNS) {
    const flags = pattern.re.flags.includes("g") ? pattern.re.flags : `${pattern.re.flags}g`;
    result = result.replace(new RegExp(pattern.re.source, flags), "[redacted]");
  }
  return result;
}

export function redactSecrets<T>(value: T): T {
  if (typeof value === "string") return redactString(value) as T;
  if (Array.isArray(value)) return value.map((item) => redactSecrets(item)) as T;
  if (isRecord(value)) {
    const result: JsonRecord = {};
    for (const [key, nested] of Object.entries(value)) {
      result[key] = redactSecrets(nested);
    }
    return result as T;
  }
  return value;
}

const SYSTEM_RULES: Array<{ re: RegExp; name: string }> = [
  { re: /webhook/, name: "Webhook" },
  { re: /schedule|cron|interval/, name: "Schedule" },
  { re: /openai|openai/, name: "OpenAI" },
  { re: /anthropic|claude/, name: "Anthropic" },
  { re: /googlegemini|googlepalm|vertexai|gemini/, name: "Google AI" },
  { re: /ollama/, name: "Ollama" },
  { re: /mistral/, name: "Mistral" },
  { re: /cohere/, name: "Cohere" },
  { re: /awsbedrock|bedrock/, name: "AWS Bedrock" },
  { re: /azureopenai/, name: "Azure OpenAI" },
  { re: /huggingface/, name: "Hugging Face" },
  { re: /gmail/, name: "Gmail" },
  { re: /googlesheets/, name: "Google Sheets" },
  { re: /googledrive/, name: "Google Drive" },
  { re: /googlecalendar/, name: "Google Calendar" },
  { re: /slack/, name: "Slack" },
  { re: /telegram/, name: "Telegram" },
  { re: /discord/, name: "Discord" },
  { re: /microsoftteams/, name: "Microsoft Teams" },
  { re: /notion/, name: "Notion" },
  { re: /airtable/, name: "Airtable" },
  { re: /hubspot/, name: "HubSpot" },
  { re: /salesforce/, name: "Salesforce" },
  { re: /stripe/, name: "Stripe" },
  { re: /shopify/, name: "Shopify" },
  { re: /postgres/, name: "Postgres" },
  { re: /mysql/, name: "MySQL" },
  { re: /mongodb|mongo/, name: "MongoDB" },
  { re: /redis/, name: "Redis" },
  { re: /supabase/, name: "Supabase" },
  { re: /httprequest|graphql/, name: "HTTP API" },
  { re: /emailsend|smtp/, name: "Email (SMTP)" },
  { re: /twilio/, name: "Twilio" },
  { re: /whatsapp/, name: "WhatsApp" },
  { re: /clickup/, name: "ClickUp" },
  { re: /asana/, name: "Asana" },
  { re: /trello/, name: "Trello" },
  { re: /jira/, name: "Jira" },
  { re: /monday/, name: "Monday" },
  { re: /linear/, name: "Linear" },
  { re: /dropbox/, name: "Dropbox" },
  { re: /filesystem|readbinaryfile|writebinaryfile/, name: "Files" },
];

const SENSITIVE_LABELS = new Set([
  "Email addresses",
  "Phone numbers",
  "Names",
  "Postal addresses",
  "Payment or billing data",
  "Health data",
  "Biometric data",
  "Location or network identifiers",
  "Government identifiers",
  "Credentials or secrets",
  "Financial data",
  "Data about children",
]);

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function clampText(value: string, max: number): string {
  const trimmed = value.trim().replace(/\s+/g, " ");
  return trimmed.length > max ? `${trimmed.slice(0, max - 3)}...` : trimmed;
}

function cleanName(value: string | undefined, fallback: string): string {
  const cleaned = value?.trim();
  return cleaned ? clampText(cleaned, 120) : fallback;
}

export function parseWorkflow(input: unknown): N8nWorkflow {
  let value: unknown = input;

  if (typeof value === "string") {
    try {
      value = JSON.parse(value) as unknown;
    } catch {
      throw new WorkflowParseError("This is not valid JSON. Export the workflow from n8n and try again.");
    }
  }

  if (!isRecord(value)) {
    throw new WorkflowParseError("Expected a workflow object. Paste the exported n8n workflow JSON.");
  }

  const candidates: unknown[] = [value];
  if (isRecord(value.data)) candidates.push(value.data);
  if (isRecord(value.workflow)) candidates.push(value.workflow);

  const candidate = candidates.find((item) => isRecord(item) && Array.isArray(item.nodes));
  if (!isRecord(candidate) || !Array.isArray(candidate.nodes)) {
    throw new WorkflowParseError(
      "This JSON has no nodes array. Use the n8n workflow export, not an execution or credentials file.",
    );
  }

  if (candidate.nodes.length === 0) {
    throw new WorkflowParseError("This workflow has no nodes.");
  }

  if (candidate.nodes.length > MAX_NODES) {
    throw new WorkflowParseError(`This workflow has ${candidate.nodes.length} nodes. The limit is ${MAX_NODES}.`);
  }

  const nodes: N8nNode[] = candidate.nodes.map((node, index) => {
    if (!isRecord(node)) {
      throw new WorkflowParseError(`Node ${index + 1} is not an object.`);
    }
    const name = asString(node.name);
    const type = asString(node.type);
    if (!name || !type) {
      throw new WorkflowParseError(`Node ${index + 1} is missing a name or type.`);
    }
    const parameters = isRecord(node.parameters) ? node.parameters : {};
    const credentials = isRecord(node.credentials)
      ? (node.credentials as Record<string, { id?: string; name?: string }>)
      : undefined;
    const position = Array.isArray(node.position)
      ? ([
          typeof node.position[0] === "number" ? node.position[0] : 0,
          typeof node.position[1] === "number" ? node.position[1] : 0,
        ] as [number, number])
      : undefined;

    return {
      id: asString(node.id),
      name,
      type,
      typeVersion: typeof node.typeVersion === "number" ? node.typeVersion : undefined,
      position,
      parameters,
      credentials,
      disabled: node.disabled === true,
      notes: asString(node.notes),
      notesInFlow: node.notesInFlow === true,
      continueOnFail: node.continueOnFail === true,
      onError: asString(node.onError),
      retryOnFail: node.retryOnFail === true,
      maxTries: typeof node.maxTries === "number" ? node.maxTries : undefined,
      waitBetweenTries: typeof node.waitBetweenTries === "number" ? node.waitBetweenTries : undefined,
      alwaysOutputData: node.alwaysOutputData === true,
      executeOnce: node.executeOnce === true,
      pinData: node.pinData,
    };
  });

  const connections = isRecord(candidate.connections)
    ? (candidate.connections as N8nWorkflow["connections"])
    : {};
  const settings = isRecord(candidate.settings) ? candidate.settings : {};

  return {
    id: asString(candidate.id),
    name: asString(candidate.name),
    active: candidate.active === true,
    nodes,
    connections,
    settings,
    pinData: isRecord(candidate.pinData) ? candidate.pinData : undefined,
    meta: isRecord(candidate.meta) ? candidate.meta : undefined,
    tags: Array.isArray(candidate.tags)
      ? candidate.tags.filter(isRecord).map((tag) => ({ name: asString(tag.name) }))
      : undefined,
  };
}

function isSticky(node: N8nNode): boolean {
  return node.type.toLowerCase().includes("stickynote");
}

function isTrigger(node: N8nNode): boolean {
  const type = node.type.toLowerCase();
  if (type.includes("respondtowebhook")) return false;
  if (TRIGGER_TYPES.has(node.type)) return true;
  return /trigger|webhook|schedule|cron|interval/.test(type);
}

function isAiNode(node: N8nNode): boolean {
  const type = node.type.toLowerCase();
  if (isSticky(node) || isTrigger(node)) return false;
  if (type.startsWith("@n8n/n8n-nodes-langchain.")) return true;
  return /openai|anthropic|googlegemini|googlepalm|vertexai|ollama|mistral|cohere|huggingface|awsbedrock|azureopenai|lmchat|embeddings|vectorstore|agent|chain|tool|reranker|textclassifier|sentimentanalysis|informationextractor/.test(
    type,
  );
}

function isAiActionNode(node: N8nNode): boolean {
  if (!isAiNode(node)) return false;
  const type = node.type.toLowerCase();
  if (/lmchat|embeddings|vectorstore|documentdefaultdataloader|textsplitter|reranker|memory|tool/.test(type)) {
    return false;
  }
  return /agent|chain|textclassifier|sentimentanalysis|informationextractor|openai|anthropic|gemini|claude|llm/.test(
    type,
  );
}

function triggerInfo(node: N8nNode): TriggerInfo {
  const type = node.type.toLowerCase();
  const params = node.parameters ?? {};
  let kind = "Trigger";
  let detail = `Entry point node ${node.name}.`;
  let authenticated: boolean | null = null;

  if (type.includes("error")) {
    kind = "Error handler";
    detail = "Runs when another workflow fails. It is not a normal entry point.";
  } else if (type.includes("webhook")) {
    kind = "Webhook";
    const auth = asString(params.authentication);
    authenticated = Boolean(auth && auth !== "none");
    detail = authenticated
      ? `Receives HTTP requests with ${auth} authentication.`
      : "Receives public HTTP requests. No authentication is configured in the export.";
  } else if (/schedule|cron|interval/.test(type)) {
    kind = "Schedule";
    const rule = params.rule;
    const cron = isRecord(rule) ? asString(rule.cronExpression) : asString(params.cronExpression);
    detail = cron ? `Runs on the schedule: ${clampText(cron, 80)}.` : "Runs on a schedule configured in n8n.";
  } else if (type.includes("manual")) {
    kind = "Manual";
    detail = "Started by hand in the n8n editor.";
  } else if (type.includes("form")) {
    kind = "Form";
    detail = "Started by a form submission.";
  } else if (type.includes("chat")) {
    kind = "Chat";
    detail = "Started by a chat message.";
  } else if (type.includes("executeworkflow")) {
    kind = "Sub-workflow";
    detail = "Called by another workflow.";
  } else if (type.includes("mcp")) {
    kind = "MCP";
    detail = "Called through the n8n MCP interface.";
  }

  return { node: node.name, kind, detail, authenticated };
}

function triggerPhrase(trigger: TriggerInfo): string {
  switch (trigger.kind) {
    case "Webhook":
      return trigger.authenticated === false
        ? "a public webhook request"
        : trigger.authenticated === true
          ? "an authenticated webhook request"
          : "a webhook request";
    case "Schedule":
      return "a schedule";
    case "Manual":
      return "a manual run";
    case "Form":
      return "a form submission";
    case "Chat":
      return "a chat message";
    case "Sub-workflow":
      return "another workflow";
    case "MCP":
      return "the MCP interface";
    case "Error handler":
      return "an error in another workflow";
    default:
      return "a trigger";
  }
}

function isApprovalNode(node: N8nNode): boolean {
  const type = node.type.toLowerCase();
  if (/approv|review|confirm|sign.?off/i.test(node.name)) return true;
  if (type.includes("approval")) return true;
  if (type.includes("wait")) {
    const resume = asString(node.parameters?.resume);
    return resume === "webhook" || resume === "form";
  }
  return false;
}

function isErrorTrigger(node: N8nNode): boolean {
  return node.type.toLowerCase().includes("errortrigger");
}

function isPlaceholderSecret(value: string): boolean {
  const token = value.replace(/^Bearer\s+/i, "").trim();
  return /^(?:YOUR|REPLACE|EXAMPLE|PLACEHOLDER|CHANGEME|CHANGE_ME|INSERT|PASTE|TODO|SAMPLE|DEMO|NOT_REAL)[A-Z0-9_ -]*$/i.test(
    token,
  );
}

function collectLeaves(value: unknown, path: string, out: Leaf[], depth = 0): void {
  if (out.length >= MAX_LEAVES || depth > 7) return;
  if (value === null || value === undefined) return;
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    const parts = path.split(".");
    out.push({
      path,
      key: parts[parts.length - 1] ?? "",
      value,
    });
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => collectLeaves(item, `${path}[${index}]`, out, depth + 1));
    return;
  }
  if (isRecord(value)) {
    for (const [key, nested] of Object.entries(value)) {
      if (key === "position" || key === "credentials" || key === "pinData") continue;
      collectLeaves(nested, path ? `${path}.${key}` : key, out, depth + 1);
    }
  }
}

function fieldLabel(path: string): string {
  return clampText(
    path
      .replace(/^parameters\.?/, "")
      .replace(/\[(\d+)\]/g, "[]")
      .replace(/\./g, " > ") || "parameters",
    120,
  );
}

function providerFor(node: N8nNode, model: string): string {
  const type = node.type.toLowerCase();
  const value = `${type} ${model}`.toLowerCase();
  if (/azureopenai/.test(value)) return "Azure OpenAI";
  if (/openai|gpt-|o1|o3|o4/.test(value)) return "OpenAI";
  if (/anthropic|claude/.test(value)) return "Anthropic";
  if (/googlegemini|googlepalm|vertexai|gemini/.test(value)) return "Google";
  if (/ollama/.test(value)) return "Ollama";
  if (/mistral/.test(value)) return "Mistral";
  if (/cohere/.test(value)) return "Cohere";
  if (/awsbedrock|bedrock/.test(value)) return "AWS Bedrock";
  if (/huggingface/.test(value)) return "Hugging Face";
  if (type.startsWith("@n8n/n8n-nodes-langchain.")) return "LangChain";
  return "Custom AI";
}

function findModel(value: unknown, depth = 0): string | undefined {
  if (depth > 6 || value === null || value === undefined) return undefined;
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findModel(item, depth + 1);
      if (found) return found;
    }
    return undefined;
  }
  if (!isRecord(value)) return undefined;
  for (const [key, nested] of Object.entries(value)) {
    const lower = key.toLowerCase();
    if (/(^|_)model(name|id)?($|_)/.test(lower) || lower === "chatmodel" || lower === "embeddingmodel") {
      if (typeof nested === "string" && nested.trim()) {
        return nested.startsWith("=") ? "Set by expression" : clampText(nested, 80);
      }
      if (isRecord(nested) && typeof nested.value === "string" && nested.value.trim()) {
        return nested.value.startsWith("=") ? "Set by expression" : clampText(nested.value, 80);
      }
    }
    const found = findModel(nested, depth + 1);
    if (found) return found;
  }
  return undefined;
}

function isWriteNode(node: N8nNode): boolean {
  const type = node.type.toLowerCase();
  const params = node.parameters ?? {};
  const method = (asString(params.requestMethod) ?? asString(params.method) ?? "GET").toUpperCase();
  const operation = (asString(params.operation) ?? asString(params.action) ?? "").toLowerCase();

  if (/httprequest|graphql/.test(type)) return method !== "GET" && method !== "HEAD";
  if (/gmail|slack|telegram|discord|microsoftteams|twilio|whatsapp|emailsend/.test(type)) return true;
  if (/googlesheets|airtable|notion|hubspot|salesforce|stripe|shopify/.test(type)) {
    return /create|append|update|delete|clear|insert|send|post|put|patch/.test(operation);
  }
  if (/postgres|mysql|mongodb|supabase|redis/.test(type)) {
    return /insert|update|delete|write|set|create/.test(operation) || /query/.test(operation);
  }
  if (/dropbox|googledrive|writebinaryfile/.test(type)) return true;
  return false;
}

function nodeErrorHandling(node: N8nNode, hasErrorWorkflow: boolean): string {
  if (node.onError === "continueErrorOutput") return "Routes errors to a separate output";
  if (node.continueOnFail) return "Continues on error";
  if (node.retryOnFail) return `Retries up to ${node.maxTries ?? 3} times`;
  if (hasErrorWorkflow) return "Workflow-level error path is configured";
  return "Stops the workflow on error";
}

function roleFor(node: N8nNode): string {
  const type = node.type.toLowerCase();
  if (isSticky(node)) return "Note";
  if (isTrigger(node)) return "Trigger";
  if (isAiNode(node)) return "AI step";
  if (/if|switch|filter|compare|merge|split/.test(type)) return "Logic";
  if (/httprequest|graphql|webhook/.test(type)) return "API call";
  if (/postgres|mysql|mongo|redis|supabase|airtable|notion|googlesheets|baserow|nocodb/.test(type)) {
    return "Data";
  }
  if (/gmail|slack|telegram|discord|microsoftteams|emailsend|twilio|whatsapp/.test(type)) {
    return "Message";
  }
  if (/wait|schedule/.test(type)) return "Wait";
  if (/code|function|set|itemlists|sort|aggregate|limit/.test(type)) return "Transform";
  if (/errortrigger|stopanderror/.test(type)) return "Error handling";
  return "Step";
}

function friendlyType(type: string): string {
  const base = type.replace(/^@[^/]+\//, "").split(".").pop() ?? type;
  return base
    .replace(/[-_]/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function systemsFor(nodes: N8nNode[]): string[] {
  const found = new Set<string>();
  for (const node of nodes) {
    if (isSticky(node)) continue;
    const value = `${node.type} ${node.name}`.toLowerCase();
    for (const rule of SYSTEM_RULES) {
      if (rule.re.test(value)) found.add(rule.name);
    }
    if (isAiNode(node)) {
      const model = findModel(node.parameters) ?? "";
      found.add(providerFor(node, model));
    }
  }
  return [...found].sort((a, b) => a.localeCompare(b));
}

function categoriesFor(nodes: N8nNode[], notes: PackNote[]): DataCategory[] {
  const evidence = new Map<string, Set<string>>();
  const add = (key: string, item: string) => {
    const set = evidence.get(key) ?? new Set<string>();
    set.add(item);
    evidence.set(key, set);
  };

  for (const node of nodes) {
    if (isSticky(node)) continue;
    const leaves: Leaf[] = [];
    collectLeaves(node.parameters ?? {}, "", leaves);
    for (const leaf of leaves) {
      const key = `${leaf.key} ${leaf.path}`.toLowerCase();
      for (const rule of DATA_RULES) {
        if (rule.keyRe.test(key)) add(rule.key, `${node.name} (${fieldLabel(leaf.path)})`);
        if (typeof leaf.value === "string" && rule.valueRe?.test(leaf.value)) {
          const label =
            rule.key === "email" ? "email-like value" : rule.key === "phone" ? "phone-like value" : "matching value";
          add(rule.key, `${node.name} (${label})`);
        }
      }
      if (
        typeof leaf.value === "string" &&
        /(^|\.)name$/.test(leaf.path) &&
        /assignments|fields|values|columns|parameters/i.test(leaf.path)
      ) {
        const fieldName = leaf.value.trim();
        const looksSecret = SECRET_PATTERNS.some((pattern) => pattern.re.test(fieldName));
        if (!looksSecret && fieldName.length > 0 && fieldName.length <= 40) {
          for (const rule of DATA_RULES) {
            if (rule.keyRe.test(fieldName)) add(rule.key, `${node.name} (field: ${fieldName})`);
          }
        }
      }
    }
    const nameLower = node.name.toLowerCase();
    for (const rule of DATA_RULES) {
      if (rule.keyRe.test(nameLower)) add(rule.key, `${node.name} (node name)`);
    }
  }

  for (const note of notes) {
    const lower = note.content.toLowerCase();
    for (const rule of DATA_RULES) {
      if (rule.keyRe.test(lower)) add(rule.key, `${note.title} (note)`);
    }
  }

  return DATA_RULES.filter((rule) => evidence.has(rule.key)).map((rule) => ({
    key: rule.key,
    label: rule.label,
    evidence: [...(evidence.get(rule.key) ?? [])].slice(0, 6),
    sensitive: SENSITIVE_LABELS.has(rule.label) || rule.sensitive,
  }));
}

function readinessFor(score: number, blocking: boolean): Readiness {
  if (blocking) return "not_ready";
  if (score >= 90) return "ready";
  if (score >= 70) return "review";
  return "not_ready";
}

export function analyzeWorkflow(input: unknown, options: AnalyzeOptions = {}): Pack {
  const workflow = parseWorkflow(input);
  const nodes = workflow.nodes;
  const realNodes = nodes.filter((node) => !isSticky(node));
  const settings = workflow.settings ?? {};
  const errorTriggerNodes = nodes.filter(isErrorTrigger);
  const hasErrorWorkflow = Boolean(asString(settings.errorWorkflow)) || errorTriggerNodes.length > 0;

  const notes: PackNote[] = nodes
    .filter(isSticky)
    .map((node) => {
      const content =
        asString(node.parameters?.content) ?? asString(node.parameters?.text) ?? node.notes ?? "";
      return { title: node.name, content: clampText(content, 1200) };
    })
    .filter((note) => note.content.length > 0);

  const outgoing = new Map<string, string[]>();
  const inbound = new Map<string, number>();
  for (const node of nodes) {
    inbound.set(node.name, inbound.get(node.name) ?? 0);
  }
  for (const [source, connection] of Object.entries(workflow.connections ?? {})) {
    const targets: string[] = [];
    for (const group of connection.main ?? []) {
      for (const target of group ?? []) {
        if (target?.node) {
          targets.push(target.node);
          inbound.set(target.node, (inbound.get(target.node) ?? 0) + 1);
        }
      }
    }
    outgoing.set(source, targets);
  }

  const triggerNodes = nodes.filter(
    (node) => isTrigger(node) && !isSticky(node) && !isErrorTrigger(node),
  );
  const entryTriggers = triggerNodes.map(triggerInfo);
  const triggers = [...entryTriggers, ...errorTriggerNodes.map(triggerInfo)];

  const order: N8nNode[] = [];
  const seen = new Set<string>();
  const starts = triggerNodes.length
    ? triggerNodes
    : nodes.filter((node) => !isSticky(node) && (inbound.get(node.name) ?? 0) === 0);
  const queue = starts.map((node) => node.name);
  while (queue.length > 0) {
    const name = queue.shift();
    if (!name || seen.has(name)) continue;
    const node = nodes.find((item) => item.name === name);
    if (!node) continue;
    seen.add(name);
    order.push(node);
    for (const target of outgoing.get(name) ?? []) {
      if (!seen.has(target)) queue.push(target);
    }
  }
  for (const node of nodes) {
    if (!isSticky(node) && !seen.has(node.name)) {
      seen.add(node.name);
      order.push(node);
    }
  }

  const aiNodes = realNodes.filter(isAiNode);
  const aiActionNodes = aiNodes.filter(isAiActionNode);
  const aiModelByTarget = new Map<string, N8nNode>();
  for (const [source, connection] of Object.entries(workflow.connections ?? {})) {
    const sourceNode = nodes.find((item) => item.name === source);
    if (!sourceNode) continue;
    for (const group of connection.ai_languageModel ?? []) {
      for (const target of group ?? []) {
        if (target?.node) aiModelByTarget.set(target.node, sourceNode);
      }
    }
  }
  const modelForNode = (node: N8nNode): string | undefined => {
    const direct = findModel(node.parameters);
    if (direct) return direct;
    const source = aiModelByTarget.get(node.name);
    return source ? findModel(source.parameters) : undefined;
  };
  const aiDownstream = new Map<string, Set<string>>();
  for (const ai of aiActionNodes) {
    const reachable = new Set<string>();
    const stack = [...(outgoing.get(ai.name) ?? [])];
    while (stack.length > 0) {
      const name = stack.pop();
      if (!name || reachable.has(name)) continue;
      reachable.add(name);
      stack.push(...(outgoing.get(name) ?? []));
    }
    aiDownstream.set(ai.name, reachable);
  }

  const approvalNode = realNodes.find(isApprovalNode);
  const waitNode = realNodes.find((node) => node.type.toLowerCase().includes("wait"));

  const aiSystems: AiSystem[] = aiActionNodes.map((node) => {
    const model = modelForNode(node) ?? "Not set in export";
    const downstream = aiDownstream.get(node.name) ?? new Set<string>();
    const canAct = [...downstream].some((name) => {
      const target = nodes.find((item) => item.name === name);
      return target ? isWriteNode(target) : false;
    });
    const categories = categoriesFor(nodes, notes).map((category) => category.label);
    return {
      node: node.name,
      provider: providerFor(aiModelByTarget.get(node.name) ?? node, model),
      model,
      purpose: clampText(node.notes ?? node.name, 160),
      dataCategories: categories.length > 0 ? categories : ["No personal data categories detected"],
      humanOversight: approvalNode
        ? `An approval or review step is present (${clampText(approvalNode.name, 60)}). Confirm a person owns the gate.`
        : waitNode
          ? `A wait step is present (${clampText(waitNode.name, 60)}), but no explicit approval step was detected. Confirm who reviews the result.`
          : "No explicit approval step detected.",
      failureHandling: nodeErrorHandling(node, hasErrorWorkflow),
      canAct,
    };
  });

  const dataCategories = categoriesFor(nodes, notes);
  const sensitiveCategories = dataCategories.filter((category) => category.sensitive);
  const systems = systemsFor(nodes);

  const credentials = new Map<string, CredentialUse>();
  for (const node of realNodes) {
    for (const [type, ref] of Object.entries(node.credentials ?? {})) {
      const name = ref?.name?.trim() || "Unnamed credential";
      const key = `${type}|${name}`;
      const existing = credentials.get(key) ?? {
        type,
        name,
        nodes: [],
        guidance: "Confirm the owner, access scope and rotation process before handover.",
      };
      if (!existing.nodes.includes(node.name)) existing.nodes.push(node.name);
      if (/personal|dev|test|admin|owner/i.test(name)) {
        existing.guidance =
          "The name suggests a personal, test or admin credential. Move it to a client-owned credential before handover.";
      }
      credentials.set(key, existing);
    }
  }

  const findings: Finding[] = [];
  const addFinding = (
    code: string,
    severity: Severity,
    title: string,
    detail: string,
    suggestion: string,
    node?: string,
    blocking = false,
  ) => {
    findings.push({ code, severity, title, detail, suggestion, node, blocking });
  };

  const secretHits: Array<{ node: string; field: string; pattern: string; length: number }> = [];
  for (const node of realNodes) {
    const leaves: Leaf[] = [];
    collectLeaves(node.parameters ?? {}, "", leaves);
    for (const leaf of leaves) {
      if (typeof leaf.value !== "string" || leaf.value.length < 8) continue;
      const value = leaf.value;
      const lower = value.toLowerCase();
      if (
        isPlaceholderSecret(value) ||
        /your[_-]?api|example|placeholder|change[_-]?me|xxxx|demo|not[_-]?a[_-]?real/.test(lower)
      ) {
        continue;
      }
      if (value.startsWith("={{") || value.startsWith("{{")) continue;
      for (const pattern of SECRET_PATTERNS) {
        if (pattern.re.test(value)) {
          if (!secretHits.some((hit) => hit.node === node.name && hit.field === leaf.path)) {
            secretHits.push({
              node: node.name,
              field: fieldLabel(leaf.path),
              pattern: pattern.name,
              length: value.length,
            });
          }
        }
      }
    }
  }
  if (secretHits.length > 0) {
    const first = secretHits[0];
    addFinding(
      "hardcoded_secret",
      "high",
      "Hardcoded secret in the workflow",
      `${secretHits.length} secret-like value${secretHits.length === 1 ? "" : "s"} found. First location: ${first?.node ?? "unknown node"}, ${first?.field ?? "unknown field"} (${first?.pattern ?? "secret"}, ${first?.length ?? 0} characters). The value is not included in this pack.`,
      "Move the value into an n8n credential, rotate it if this export was shared, and regenerate the pack.",
      first?.node,
      true,
    );
  }

  if (!hasErrorWorkflow) {
    addFinding(
      "no_error_workflow",
      "medium",
      "No error workflow is configured",
      "When a node fails, nobody is notified unless the execution is watched manually.",
      "Set a workflow-level error workflow or an Error Trigger that alerts the agency and the client.",
    );
  }

  for (const ai of aiActionNodes) {
    const hasNodeError = Boolean(ai.onError || ai.continueOnFail || ai.retryOnFail);
    if (!hasNodeError && !hasErrorWorkflow) {
      addFinding(
        "ai_without_error_handling",
        "high",
        "AI step has no failure path",
        `${ai.name} has no node-level error handling and the workflow has no error workflow. Model timeouts, rate limits and malformed output will stop the run.`,
        "Add a retry or error output, and route failures to a human or a fallback response.",
        ai.name,
      );
    }
    if (modelForNode(ai) === undefined) {
      addFinding(
        "ai_model_not_in_export",
        "medium",
        "AI model is not visible in the export",
        `${ai.name} does not expose a model name. The pack cannot tell the client which model is used.`,
        "Document the model and provider in the node name or notes, then regenerate the pack.",
        ai.name,
      );
    }
    const downstream = aiDownstream.get(ai.name) ?? new Set<string>();
    const canAct = [...downstream].some((name) => {
      const target = nodes.find((item) => item.name === name);
      return target ? isWriteNode(target) : false;
    });
    if (canAct && !approvalNode) {
      addFinding(
        "ai_can_act_without_approval",
        "high",
        "AI can take action without a human gate",
        `${ai.name} can reach a node that writes, sends or changes data, and no wait or approval step was detected. A bad model output can become a real action.`,
        "Add a human approval step before the write action, or restrict the AI to read-only tools.",
        ai.name,
      );
    }
  }

  for (const trigger of triggerNodes) {
    const info = triggerInfo(trigger);
    if (info.kind === "Webhook" && info.authenticated === false) {
      addFinding(
        "webhook_unauthenticated",
        "high",
        "Webhook accepts unauthenticated requests",
        `${trigger.name} has no authentication configured in the export. Anyone with the URL can start the workflow.`,
        "Add header or basic authentication, or confirm the endpoint is intentionally public and rate-limited.",
        trigger.name,
      );
    }
  }

  for (const node of realNodes) {
    if (/httprequest|graphql/i.test(node.type)) {
      const options = node.parameters?.options;
      const timeout =
        (isRecord(options) ? options.timeout : undefined) ??
        node.parameters?.timeout;
      if (timeout === undefined || timeout === null || timeout === "") {
        addFinding(
          "http_no_timeout",
          "medium",
          "HTTP request has no timeout",
          `${node.name} can wait indefinitely if the remote API hangs.`,
          "Set a timeout in the node options and add a retry policy for transient failures.",
          node.name,
        );
      }
      if (!node.retryOnFail && !node.continueOnFail && !hasErrorWorkflow) {
        addFinding(
          "http_no_retry",
          "low",
          "HTTP request has no retry or error path",
          `${node.name} will stop the workflow on a transient network or rate-limit error.`,
          "Enable retries with backoff, or route the error to an operator.",
          node.name,
        );
      }
    }
  }

  if (triggerNodes.length > 1) {
    addFinding(
      "multiple_triggers",
      "medium",
      "Workflow has more than one entry point",
      `${triggerNodes.length} triggers were found: ${triggerNodes.map((node) => node.name).join(", ")}. The client may not know which one is live.`,
      "Document which trigger is used in production, disable the others, or split the workflow.",
    );
  }

  const disabled = realNodes.filter((node) => node.disabled);
  if (disabled.length > 0) {
    addFinding(
      "disabled_nodes",
      "low",
      "Disabled nodes are included in the export",
      `${disabled.length} disabled node${disabled.length === 1 ? "" : "s"}: ${disabled.map((node) => node.name).join(", ")}.`,
      "Remove dead nodes or explain them in the handover so the client does not treat them as active.",
    );
  }

  const orphans = realNodes.filter(
    (node) => !isTrigger(node) && (inbound.get(node.name) ?? 0) === 0 && (outgoing.get(node.name)?.length ?? 0) === 0,
  );
  if (orphans.length > 0) {
    addFinding(
      "orphan_nodes",
      "low",
      "Some nodes are not connected",
      `Unconnected nodes: ${orphans.map((node) => node.name).join(", ")}.`,
      "Remove them or document why they are kept.",
    );
  }

  if (aiNodes.length > 0 && sensitiveCategories.length > 0) {
    addFinding(
      "personal_data_to_ai",
      "high",
      "AI steps may process personal data",
      `The workflow appears to handle ${sensitiveCategories.map((category) => category.label.toLowerCase()).join(", ")} and includes AI steps. Confirm what is sent to the model.`,
      "Minimize or mask personal data before the AI node. Document the lawful basis, retention and human review with the client.",
    );
  }

  if (
    aiNodes.length === 0 &&
    sensitiveCategories.some((category) => category.key === "email" || category.key === "phone")
  ) {
    addFinding(
      "personal_data_detected",
      "medium",
      "Personal data is present in the workflow",
      `The workflow appears to handle ${sensitiveCategories.map((category) => category.label.toLowerCase()).join(", ")}.`,
      "Document where the data comes from, where it is stored and how long it is kept.",
    );
  }

  if (sensitiveCategories.length > 0 && asString(settings.saveDataSuccessExecution) === "all") {
    addFinding(
      "saves_all_execution_data",
      "medium",
      "n8n saves all successful execution data",
      "Execution data can include the personal data that flowed through the workflow.",
      "Set successful execution saving to none or a limited retention period, and document the setting.",
      undefined,
    );
  }

  for (const credential of credentials.values()) {
    if (/personal|dev|test|admin|owner/i.test(credential.name)) {
      addFinding(
        "personal_credential_name",
        "medium",
        "Credential name looks personal or temporary",
        `${credential.name} is used by ${credential.nodes.join(", ")}.`,
        "Create a client-owned credential with a clear name, then re-point the nodes before handover.",
        credential.nodes[0],
      );
    }
  }

  if (notes.length === 0) {
    addFinding(
      "no_notes",
      "low",
      "No agency notes in the workflow",
      "Sticky notes are empty or missing, so the next maintainer has no context.",
      "Add a short sticky note with the business purpose, owner and known caveats.",
    );
  }

  if (aiNodes.length > 0 || realNodes.some((node) => /httprequest|graphql/i.test(node.type))) {
    if (settings.executionTimeout === undefined) {
      addFinding(
        "no_execution_timeout",
        "low",
        "No workflow execution timeout",
        "A stuck AI or API call can hold an execution open.",
        "Set an execution timeout in the workflow settings.",
      );
    }
  }

  if (settings.timezone === undefined) {
    addFinding(
      "no_timezone",
      "info",
      "No workflow timezone is set",
      "Schedule and date logic may use the instance default.",
      "Set the timezone explicitly, especially for schedules and client-facing dates.",
    );
  }

  const weights: Record<Severity, number> = { high: 15, medium: 8, low: 3, info: 0 };
  let score = 100;
  for (const finding of findings) score -= weights[finding.severity];
  const blocking = findings.some((finding) => finding.blocking === true);
  if (blocking) score = Math.min(score, 55);
  score = Math.max(0, Math.min(100, Math.round(score)));

  const severityRank: Record<Severity, number> = { high: 0, medium: 1, low: 2, info: 3 };
  findings.sort((a, b) => severityRank[a.severity] - severityRank[b.severity] || a.code.localeCompare(b.code));

  const steps: WorkflowStep[] = order
    .filter((node) => !isSticky(node))
    .map((node) => ({
      name: node.name,
      type: node.type,
      role: roleFor(node),
      notes: node.notes ? clampText(node.notes, 280) : undefined,
      disabled: node.disabled === true,
      errorHandling: nodeErrorHandling(node, hasErrorWorkflow),
    }));

  const workflowName = cleanName(workflow.name, "This workflow");
  const triggerSentence =
    entryTriggers.length === 0
      ? `${workflowName} has no detected trigger.`
      : entryTriggers.length === 1
        ? `${workflowName} starts from ${triggerPhrase(entryTriggers[0]!)}.`
        : `${workflowName} has ${entryTriggers.length} entry points.`;

  const aiSummary =
    aiSystems.length === 0
      ? "It has no AI steps"
      : `It has ${aiSystems.length} AI step${aiSystems.length === 1 ? "" : "s"} (${[...new Set(aiSystems.map((ai) => ai.provider))].join(", ")})`;

  const dataSummary =
    dataCategories.length === 0
      ? "No personal data categories were detected"
      : `It appears to touch ${dataCategories.map((category) => category.label.toLowerCase()).join(", ")}`;

  const highCount = findings.filter((finding) => finding.severity === "high").length;
  const mediumCount = findings.filter((finding) => finding.severity === "medium").length;
  const riskSummary =
    highCount > 0
      ? `${highCount} high-severity finding${highCount === 1 ? "" : "s"} ${highCount === 1 ? "needs" : "need"} attention before handover.`
      : mediumCount > 0
        ? `${mediumCount} point${mediumCount === 1 ? "" : "s"} should be reviewed before handover.`
        : "No blocking issues were detected. Confirm the inferred details with the client.";

  const summary = `${triggerSentence} ${aiSummary} and runs ${steps.length} steps. ${dataSummary}. ${riskSummary}`;

  const settingsMap: Record<string, string> = {};
  const settingLabels: Array<[string, string]> = [
    ["executionOrder", "Execution order"],
    ["timezone", "Timezone"],
    ["saveDataSuccessExecution", "Save successful executions"],
    ["saveDataErrorExecution", "Save failed executions"],
    ["saveManualExecutions", "Save manual executions"],
    ["executionTimeout", "Execution timeout"],
    ["callerPolicy", "Caller policy"],
    ["saveExecutionProgress", "Save execution progress"],
  ];
  for (const [key, label] of settingLabels) {
    const value = settings[key];
    if (value === undefined || value === null || value === "") continue;
    settingsMap[label] = typeof value === "object" ? JSON.stringify(value) : String(value);
  }
  if (asString(settings.errorWorkflow)) {
    settingsMap["Error workflow"] = "Configured (workflow id hidden)";
  }

  const failures = [
    ...findings
      .filter((finding) => finding.severity === "high" || finding.severity === "medium")
      .slice(0, 6)
      .map((finding) => `${finding.title}: ${finding.suggestion}`),
    "Credential expired or revoked.",
    "Remote API rate limit or schema change.",
    ...(aiNodes.length > 0 ? ["AI output drifts or returns malformed data."] : []),
  ];

  const runbook = {
    start: [
      ...(triggers.length > 0
        ? triggers.map((trigger) => `${trigger.node}: ${trigger.detail}`)
        : ["No trigger was detected. Confirm how the workflow is started before handover."]),
      `Active state in the export: ${workflow.active ? "active" : "inactive or not included"}.`,
      ...(systems.includes("Webhook") || systems.includes("Schedule")
        ? ["Confirm the production webhook URL and schedule in the client's n8n project."]
        : []),
    ],
    test: [
      "Duplicate the workflow before testing so the production copy is untouched.",
      "Pin a representative payload that contains no real customer data.",
      "Run once and inspect every branch, including the error path.",
      ...(aiNodes.length > 0 ? ["Check AI output against 10 representative inputs, including a refusal and a malformed answer."] : []),
      "Confirm the client can see the execution and knows who to contact when it fails.",
    ],
    monitor: [
      "Use the n8n Executions view for failed and slow runs.",
      hasErrorWorkflow
        ? "Confirm the configured error workflow reaches a named human."
        : "Add an error workflow that reaches a named human.",
      "Agree a weekly or monthly failure review with the client.",
      ...(aiNodes.length > 0 ? ["Track AI output quality and cost, not only uptime."] : []),
    ],
    failures,
    change: [
      "Export the workflow JSON after every material change.",
      "Generate a new pack version and compare the findings.",
      "Tell the client what changed, why, and what they need to re-test.",
      "Keep the previous pack available until the client signs off the new one.",
    ],
  };

  const checklist = [
    "Trigger tested with production-like data.",
    "Every credential has a named owner and an agreed rotation process.",
    "Error path tested and alerts reach a human.",
    "Client data categories confirmed.",
    "Client knows how to pause or disable the workflow.",
    "Client knows who owns the n8n instance and the connected accounts.",
    ...(aiNodes.length > 0
      ? [
          "AI model and provider documented.",
          "AI outputs reviewed against representative inputs.",
          "Human review or approval step agreed for actions that write data.",
        ]
      : []),
    "Handover call completed and the client signed off.",
    "Next review date agreed.",
  ];

  const limitations = [
    "This pack is generated from the exported workflow JSON. It does not resolve or store credential values, runtime data or n8n instance settings.",
    "Data categories and AI use are inferred from node types, names and parameters. Confirm them with the client.",
    "No secret values are included. Credential names may still be sensitive; review the pack before sharing it.",
    "Custom nodes and dynamic expressions may not be fully understood.",
    "This is a documentation aid, not legal advice. Privacy and AI obligations depend on the specific use case and jurisdiction.",
  ];

  const pack: Pack = {
    version: 1,
    generatedAt: options.generatedAt ?? new Date().toISOString(),
    packName: cleanName(options.packName ?? workflow.name, "Untitled workflow"),
    clientName: cleanName(options.clientName, "Client"),
    agencyName: cleanName(options.agencyName, "Your agency"),
    score,
    readiness: readinessFor(score, blocking),
    summary,
    workflow: {
      name: cleanName(workflow.name, "Untitled workflow"),
      nodeCount: realNodes.length,
      triggerCount: triggerNodes.length,
      aiNodeCount: aiActionNodes.length,
      credentialCount: credentials.size,
      disabledCount: disabled.length,
      integrationCount: systems.length,
      hasErrorWorkflow,
    },
    triggers,
    steps,
    systems,
    credentials: [...credentials.values()],
    dataCategories,
    aiSystems,
    findings,
    notes,
    settings: settingsMap,
    runbook,
    checklist,
    limitations,
    source: {
      format: "n8n",
      bytes: options.sourceBytes ?? JSON.stringify(input).length,
    },
  };

  return redactSecrets(pack);
}
