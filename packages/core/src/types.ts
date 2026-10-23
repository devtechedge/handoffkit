export type Severity = "high" | "medium" | "low" | "info";

export type Readiness = "ready" | "review" | "not_ready";

export interface Finding {
  code: string;
  severity: Severity;
  title: string;
  detail: string;
  node?: string;
  suggestion: string;
  blocking?: boolean;
}

export interface CredentialUse {
  type: string;
  name: string;
  nodes: string[];
  guidance: string;
}

export interface AiSystem {
  node: string;
  provider: string;
  model: string;
  purpose: string;
  dataCategories: string[];
  humanOversight: string;
  failureHandling: string;
  canAct: boolean;
}

export interface WorkflowStep {
  name: string;
  type: string;
  role: string;
  notes?: string;
  disabled: boolean;
  errorHandling: string;
}

export interface DataCategory {
  key: string;
  label: string;
  evidence: string[];
  sensitive: boolean;
}

export interface PackNote {
  title: string;
  content: string;
}

export interface TriggerInfo {
  node: string;
  kind: string;
  detail: string;
  authenticated: boolean | null;
}

export interface Pack {
  version: 1;
  generatedAt: string;
  packName: string;
  clientName: string;
  agencyName: string;
  score: number;
  readiness: Readiness;
  summary: string;
  workflow: {
    name: string;
    nodeCount: number;
    triggerCount: number;
    aiNodeCount: number;
    credentialCount: number;
    disabledCount: number;
    integrationCount: number;
    hasErrorWorkflow: boolean;
  };
  triggers: TriggerInfo[];
  steps: WorkflowStep[];
  systems: string[];
  credentials: CredentialUse[];
  dataCategories: DataCategory[];
  aiSystems: AiSystem[];
  findings: Finding[];
  notes: PackNote[];
  settings: Record<string, string>;
  runbook: {
    start: string[];
    test: string[];
    monitor: string[];
    failures: string[];
    change: string[];
  };
  checklist: string[];
  limitations: string[];
  source: {
    format: "n8n";
    bytes: number;
  };
}

export interface AnalyzeOptions {
  clientName?: string;
  agencyName?: string;
  packName?: string;
  generatedAt?: string;
  sourceBytes?: number;
}

export interface N8nCredentialRef {
  id?: string;
  name?: string;
}

export interface N8nNode {
  id?: string;
  name: string;
  type: string;
  typeVersion?: number;
  position?: [number, number];
  parameters?: Record<string, unknown>;
  credentials?: Record<string, N8nCredentialRef>;
  disabled?: boolean;
  notes?: string;
  notesInFlow?: boolean;
  continueOnFail?: boolean;
  onError?: string;
  retryOnFail?: boolean;
  maxTries?: number;
  waitBetweenTries?: number;
  alwaysOutputData?: boolean;
  executeOnce?: boolean;
  pinData?: unknown;
}

export interface N8nConnectionTarget {
  node: string;
  type?: string;
  index?: number;
}

export interface N8nConnection {
  main?: N8nConnectionTarget[][];
}

export interface N8nWorkflow {
  id?: string;
  name?: string;
  active?: boolean;
  nodes: N8nNode[];
  connections?: Record<string, N8nConnection>;
  settings?: Record<string, unknown>;
  pinData?: Record<string, unknown>;
  meta?: Record<string, unknown>;
  tags?: Array<{ name?: string }>;
}

export class WorkflowParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "WorkflowParseError";
  }
}
