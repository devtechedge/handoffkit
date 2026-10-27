import type { Finding, Pack, Severity } from "./types.js";

function cell(value: string): string {
  return value.replace(/\|/g, "\\|").replace(/\r?\n/g, " ").trim();
}

function bullets(items: string[]): string {
  if (items.length === 0) return "_None._";
  return items.map((item) => `- ${item}`).join("\n");
}

function hasCustomErrorHandling(value: string): boolean {
  return /^(Routes|Continues|Retries)/.test(value);
}

function severityLabel(severity: Severity): string {
  switch (severity) {
    case "high":
      return "High";
    case "medium":
      return "Medium";
    case "low":
      return "Low";
    default:
      return "Info";
  }
}

function readinessLabel(pack: Pack): string {
  if (pack.readiness === "ready") return "Ready to hand over";
  if (pack.readiness === "review") return "Needs a review pass";
  return "Not ready to hand over";
}

function findingBlock(finding: Finding): string {
  const node = finding.node ? ` Node: ${finding.node}.` : "";
  return `### ${severityLabel(finding.severity)}: ${finding.title}\n\n${finding.detail}${node}\n\n**Suggested fix:** ${finding.suggestion}`;
}

export function renderPackMarkdown(pack: Pack): string {
  const generated = new Date(pack.generatedAt);
  const generatedLabel = Number.isNaN(generated.getTime())
    ? pack.generatedAt
    : generated.toISOString().slice(0, 10);

  const high = pack.findings.filter((finding) => finding.severity === "high");
  const medium = pack.findings.filter((finding) => finding.severity === "medium");
  const low = pack.findings.filter((finding) => finding.severity === "low");
  const info = pack.findings.filter((finding) => finding.severity === "info");

  const findingSections = [
    high.length > 0 ? `## High severity\n\n${high.map(findingBlock).join("\n\n")}` : "",
    medium.length > 0 ? `## Medium severity\n\n${medium.map(findingBlock).join("\n\n")}` : "",
    low.length > 0 ? `## Low severity\n\n${low.map(findingBlock).join("\n\n")}` : "",
    info.length > 0 ? `## Notes\n\n${info.map(findingBlock).join("\n\n")}` : "",
  ]
    .filter(Boolean)
    .join("\n\n");

  const steps = pack.steps
    .map((step, index) => {
      const badges = [step.role, step.disabled ? "disabled" : ""].filter(Boolean).join(", ");
      const notes = step.notes ? `\n   ${step.notes}` : "";
      const error = hasCustomErrorHandling(step.errorHandling)
        ? `\n   Error handling: ${step.errorHandling}.`
        : "";
      return `${index + 1}. **${step.name}** (${badges})${error}${notes}`;
    })
    .join("\n");

  const aiSystems =
    pack.aiSystems.length === 0
      ? "_No AI steps were detected._"
      : pack.aiSystems
          .map(
            (ai) =>
              `### ${ai.node}\n\n- Provider: ${ai.provider}\n- Model: ${ai.model}\n- Purpose: ${ai.purpose}\n- Data categories: ${ai.dataCategories.join(", ")}\n- Human oversight: ${ai.humanOversight}\n- Failure handling: ${ai.failureHandling}\n- Can take action: ${ai.canAct ? "Yes. Review the write path." : "No write path detected"}`,
          )
          .join("\n\n");

  const credentials =
    pack.credentials.length === 0
      ? "_No credentials are referenced in the export._"
      : [
          "| Type | Name | Used by | Guidance |",
          "| --- | --- | --- | --- |",
          ...pack.credentials.map(
            (credential) =>
              `| ${cell(credential.type)} | ${cell(credential.name)} | ${cell(credential.nodes.join(", "))} | ${cell(credential.guidance)} |`,
          ),
        ].join("\n");

  const dataCategories =
    pack.dataCategories.length === 0
      ? "_No personal data categories were detected._"
      : pack.dataCategories
          .map(
            (category) =>
              `- **${category.label}**${category.sensitive ? " (sensitive)" : ""}: ${category.evidence.join("; ")}`,
          )
          .join("\n");

  const settings =
    Object.keys(pack.settings).length === 0
      ? "_No workflow settings were exported._"
      : [
          "| Setting | Value |",
          "| --- | --- |",
          ...Object.entries(pack.settings).map(([key, value]) => `| ${cell(key)} | ${cell(value)} |`),
        ].join("\n");

  const notes =
    pack.notes.length === 0
      ? "_No agency notes were found._"
      : pack.notes.map((note) => `> **${note.title}**\n>\n> ${note.content.replace(/\n/g, "\n> ")}`).join("\n\n");

  return `# ${pack.packName}

**Client:** ${pack.clientName}
**Prepared by:** ${pack.agencyName}
**Generated:** ${generatedLabel}
**Readiness:** ${readinessLabel(pack)} (${pack.score}/100)

> ${pack.summary}

## At a glance

| Item | Value |
| --- | --- |
| Workflow | ${cell(pack.workflow.name)} |
| Nodes | ${pack.workflow.nodeCount} |
| Triggers | ${pack.workflow.triggerCount} |
| AI steps | ${pack.workflow.aiNodeCount} |
| Credentials | ${pack.workflow.credentialCount} |
| Integrations | ${pack.workflow.integrationCount} |
| Error workflow | ${pack.workflow.hasErrorWorkflow ? "Configured" : "Not configured"} |

## Triggers

${pack.triggers.length === 0 ? "_No trigger was detected._" : pack.triggers.map((trigger) => `- **${trigger.node}** (${trigger.kind}): ${trigger.detail}`).join("\n")}

## What it does

${steps || "_No steps were detected._"}

## AI register

${aiSystems}

## Data categories

${dataCategories}

## Credentials

${credentials}

## Systems

${pack.systems.length === 0 ? "_No systems were detected._" : pack.systems.join(", ")}

## Findings

${findingSections || "_No findings._"}

## Runbook

### Start

${bullets(pack.runbook.start)}

### Test before handover

${bullets(pack.runbook.test)}

### Monitor

${bullets(pack.runbook.monitor)}

### Common failures

${bullets(pack.runbook.failures)}

### Change process

${bullets(pack.runbook.change)}

## Acceptance checklist

${pack.checklist.map((item) => `- [ ] ${item}`).join("\n")}

## Workflow settings

${settings}

## Agency notes

${notes}

## Limitations

${bullets(pack.limitations)}

---

Generated by HandoffKit for ${pack.agencyName}. This pack is a documentation aid, not legal advice. Confirm the inferred details with the client before relying on them.
`;
}
