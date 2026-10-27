import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import type { Finding, Pack, Severity } from "./types.js";

const A4 = { width: 595.28, height: 841.89 };
const MARGIN = 48;

const INK = rgb(0.08, 0.1, 0.12);
const MUTED = rgb(0.42, 0.45, 0.5);
const LINE = rgb(0.87, 0.88, 0.89);
const ACCENT = rgb(0.05, 0.45, 0.42);
const PAPER = rgb(0.985, 0.975, 0.95);
const HIGH = rgb(0.7, 0.15, 0.15);
const MEDIUM = rgb(0.68, 0.4, 0.04);
const LOW = rgb(0.23, 0.4, 0.63);
const GREEN = rgb(0.05, 0.47, 0.29);

function safe(text: string): string {
  return text
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/\u2026/g, "...")
    .replace(/\u00a0/g, " ")
    .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, "?");
}

function hasCustomErrorHandling(value: string): boolean {
  return /^(Routes|Continues|Retries)/.test(value);
}

function short(text: string, max: number): string {
  const cleaned = safe(text).replace(/\s+/g, " ").trim();
  return cleaned.length > max ? `${cleaned.slice(0, max - 3)}...` : cleaned;
}

function severityColor(severity: Severity) {
  if (severity === "high") return HIGH;
  if (severity === "medium") return MEDIUM;
  if (severity === "low") return LOW;
  return MUTED;
}

function readinessColor(pack: Pack) {
  if (pack.readiness === "ready") return GREEN;
  if (pack.readiness === "review") return MEDIUM;
  return HIGH;
}

function readinessLabel(pack: Pack): string {
  if (pack.readiness === "ready") return "Ready to hand over";
  if (pack.readiness === "review") return "Needs a review pass";
  return "Not ready to hand over";
}

class Writer {
  private doc: PDFDocument;
  private page: PDFPage;
  private font: PDFFont;
  private bold: PDFFont;
  private italic: PDFFont;
  private y: number;
  private pageIndex = 0;
  private packTitle: string;
  private client: string;

  constructor(doc: PDFDocument, font: PDFFont, bold: PDFFont, italic: PDFFont, pack: Pack) {
    this.doc = doc;
    this.font = font;
    this.bold = bold;
    this.italic = italic;
    this.packTitle = short(pack.packName, 70);
    this.client = short(pack.clientName, 50);
    this.page = doc.addPage([A4.width, A4.height]);
    this.y = A4.height - MARGIN;
  }

  private get contentWidth(): number {
    return A4.width - MARGIN * 2;
  }

  private newPage(): void {
    this.page = this.doc.addPage([A4.width, A4.height]);
    this.pageIndex += 1;
    this.y = A4.height - 72;
  }

  private ensure(space: number): void {
    if (this.y - space < MARGIN + 26) this.newPage();
  }

  private wrap(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
    const clean = safe(text).replace(/\s+/g, " ").trim();
    if (!clean) return [""];
    const words = clean.split(" ");
    const lines: string[] = [];
    let current = "";
    for (const word of words) {
      const candidate = current ? `${current} ${word}` : word;
      if (font.widthOfTextAtSize(candidate, size) <= maxWidth) {
        current = candidate;
        continue;
      }
      if (current) lines.push(current);
      if (font.widthOfTextAtSize(word, size) <= maxWidth) {
        current = word;
        continue;
      }
      let chunk = "";
      for (const char of word) {
        if (font.widthOfTextAtSize(chunk + char, size) > maxWidth && chunk) {
          lines.push(chunk);
          chunk = char;
        } else {
          chunk += char;
        }
      }
      current = chunk;
    }
    if (current) lines.push(current);
    return lines.length > 0 ? lines : [""];
  }

  paragraph(
    text: string,
    options: {
      size?: number;
      font?: PDFFont;
      color?: ReturnType<typeof rgb>;
      lineHeight?: number;
      spaceAfter?: number;
      indent?: number;
    } = {},
  ): void {
    const size = options.size ?? 10;
    const font = options.font ?? this.font;
    const color = options.color ?? INK;
    const lineHeight = options.lineHeight ?? size * 1.45;
    const indent = options.indent ?? 0;
    const lines = this.wrap(text, font, size, this.contentWidth - indent);
    for (const line of lines) {
      this.ensure(lineHeight);
      this.page.drawText(line, {
        x: MARGIN + indent,
        y: this.y - size,
        size,
        font,
        color,
      });
      this.y -= lineHeight;
    }
    this.y -= options.spaceAfter ?? 0;
  }

  label(text: string): void {
    this.ensure(24);
    this.page.drawText(short(text.toUpperCase(), 80), {
      x: MARGIN,
      y: this.y - 8,
      size: 7.5,
      font: this.bold,
      color: ACCENT,
    });
    this.y -= 16;
  }

  heading(text: string): void {
    this.ensure(58);
    this.y -= 10;
    this.page.drawRectangle({
      x: MARGIN,
      y: this.y - 8,
      width: 18,
      height: 3,
      color: ACCENT,
    });
    this.y -= 20;
    this.page.drawText(short(text, 90), {
      x: MARGIN,
      y: this.y - 13,
      size: 15,
      font: this.bold,
      color: INK,
    });
    this.y -= 22;
    this.page.drawLine({
      start: { x: MARGIN, y: this.y },
      end: { x: A4.width - MARGIN, y: this.y },
      thickness: 0.7,
      color: LINE,
    });
    this.y -= 14;
  }

  subheading(text: string): void {
    this.ensure(34);
    this.y -= 4;
    this.page.drawText(short(text, 100), {
      x: MARGIN,
      y: this.y - 11,
      size: 10.5,
      font: this.bold,
      color: INK,
    });
    this.y -= 20;
  }

  bullet(text: string): void {
    const size = 9.5;
    const lineHeight = size * 1.42;
    const indent = 13;
    const lines = this.wrap(text, this.font, size, this.contentWidth - indent);
    lines.forEach((line, index) => {
      this.ensure(lineHeight);
      if (index === 0) {
        this.page.drawCircle({ x: MARGIN + 3, y: this.y - size + 3, size: 1.5, color: ACCENT });
      }
      this.page.drawText(line, {
        x: MARGIN + indent,
        y: this.y - size,
        size,
        font: this.font,
        color: INK,
      });
      this.y -= lineHeight;
    });
    this.y -= 2;
  }

  kv(label: string, value: string): void {
    this.ensure(26);
    this.page.drawText(short(label, 60), {
      x: MARGIN,
      y: this.y - 9,
      size: 8.5,
      font: this.bold,
      color: MUTED,
    });
    this.page.drawText(short(value, 120), {
      x: MARGIN + 110,
      y: this.y - 9,
      size: 9.5,
      font: this.font,
      color: INK,
    });
    this.y -= 16;
  }

  finding(finding: Finding): void {
    this.ensure(48);
    this.page.drawText(short(finding.severity.toUpperCase(), 12), {
      x: MARGIN,
      y: this.y - 8,
      size: 7,
      font: this.bold,
      color: severityColor(finding.severity),
    });
    this.page.drawText(short(finding.title, 80), {
      x: MARGIN + 54,
      y: this.y - 9,
      size: 10.5,
      font: this.bold,
      color: INK,
    });
    this.y -= 20;
    this.paragraph(finding.detail, { size: 9.5, color: INK, spaceAfter: 3 });
    this.paragraph(`Fix: ${finding.suggestion}`, {
      size: 9,
      font: this.italic,
      color: MUTED,
      spaceAfter: 10,
    });
  }

  cover(pack: Pack): void {
    this.page.drawRectangle({ x: 0, y: 0, width: A4.width, height: A4.height, color: PAPER });
    this.page.drawRectangle({ x: 0, y: A4.height - 10, width: A4.width, height: 10, color: ACCENT });

    this.page.drawText("HANDOFFKIT", {
      x: MARGIN,
      y: A4.height - 62,
      size: 9,
      font: this.bold,
      color: ACCENT,
    });
    this.page.drawText("CLIENT HANDOVER PACK", {
      x: MARGIN,
      y: A4.height - 78,
      size: 8,
      font: this.font,
      color: MUTED,
    });

    this.y = A4.height - 150;
    const titleLines = this.wrap(pack.packName, this.bold, 30, this.contentWidth);
    for (const line of titleLines.slice(0, 4)) {
      this.page.drawText(line, {
        x: MARGIN,
        y: this.y,
        size: 30,
        font: this.bold,
        color: INK,
      });
      this.y -= 38;
    }

    this.y -= 4;
    this.page.drawLine({
      start: { x: MARGIN, y: this.y },
      end: { x: MARGIN + 80, y: this.y },
      thickness: 4,
      color: ACCENT,
    });
    this.y -= 34;

    this.page.drawText("CLIENT", {
      x: MARGIN,
      y: this.y,
      size: 7.5,
      font: this.bold,
      color: MUTED,
    });
    this.page.drawText(short(pack.clientName, 70), {
      x: MARGIN,
      y: this.y - 18,
      size: 13,
      font: this.font,
      color: INK,
    });
    this.y -= 54;

    this.page.drawText("PREPARED BY", {
      x: MARGIN,
      y: this.y,
      size: 7.5,
      font: this.bold,
      color: MUTED,
    });
    this.page.drawText(short(pack.agencyName, 70), {
      x: MARGIN,
      y: this.y - 18,
      size: 13,
      font: this.font,
      color: INK,
    });
    this.y -= 54;

    const generated = new Date(pack.generatedAt);
    const generatedLabel = Number.isNaN(generated.getTime())
      ? pack.generatedAt
      : generated.toISOString().slice(0, 10);
    this.page.drawText("GENERATED", {
      x: MARGIN,
      y: this.y,
      size: 7.5,
      font: this.bold,
      color: MUTED,
    });
    this.page.drawText(generatedLabel, {
      x: MARGIN,
      y: this.y - 18,
      size: 13,
      font: this.font,
      color: INK,
    });

    const scoreColor = readinessColor(pack);
    const circleX = A4.width - 118;
    const circleY = 250;
    this.page.drawCircle({ x: circleX, y: circleY, size: 58, color: scoreColor });
    const scoreText = String(pack.score);
    const scoreWidth = this.bold.widthOfTextAtSize(scoreText, 26);
    this.page.drawText(scoreText, {
      x: circleX - scoreWidth / 2,
      y: circleY - 6,
      size: 26,
      font: this.bold,
      color: rgb(1, 1, 1),
    });
    const readinessText = readinessLabel(pack);
    const readinessWidth = this.font.widthOfTextAtSize(readinessText, 7.5);
    this.page.drawText(readinessText, {
      x: circleX - readinessWidth / 2,
      y: circleY - 24,
      size: 7.5,
      font: this.font,
      color: rgb(1, 1, 1),
    });

    this.page.drawLine({
      start: { x: MARGIN, y: 118 },
      end: { x: A4.width - MARGIN, y: 118 },
      thickness: 0.7,
      color: LINE,
    });
    this.page.drawText("Generated from an n8n workflow export. No secret values are included.", {
      x: MARGIN,
      y: 96,
      size: 8,
      font: this.font,
      color: MUTED,
    });
    this.page.drawText("This pack is a documentation aid, not legal advice.", {
      x: MARGIN,
      y: 83,
      size: 8,
      font: this.font,
      color: MUTED,
    });

    this.newPage();
  }

  async finish(): Promise<Uint8Array> {
    const pages = this.doc.getPages();
    const total = pages.length;
    pages.forEach((page, index) => {
      const { width, height } = page.getSize();
      if (index > 0) {
        page.drawText("HANDOFFKIT", {
          x: MARGIN,
          y: height - 42,
          size: 7,
          font: this.bold,
          color: ACCENT,
        });
        page.drawText(short(this.packTitle, 64), {
          x: MARGIN + 74,
          y: height - 42,
          size: 7,
          font: this.font,
          color: MUTED,
        });
        page.drawLine({
          start: { x: MARGIN, y: height - 50 },
          end: { x: width - MARGIN, y: height - 50 },
          thickness: 0.6,
          color: LINE,
        });
      }

      page.drawLine({
        start: { x: MARGIN, y: 46 },
        end: { x: width - MARGIN, y: 46 },
        thickness: 0.6,
        color: LINE,
      });
      page.drawText("Prepared for " + short(this.client, 50), {
        x: MARGIN,
        y: 32,
        size: 7.5,
        font: this.font,
        color: MUTED,
      });
      const label = `${index + 1} / ${total}`;
      const labelWidth = this.font.widthOfTextAtSize(label, 7.5);
      page.drawText(label, {
        x: width - MARGIN - labelWidth,
        y: 32,
        size: 7.5,
        font: this.font,
        color: MUTED,
      });
    });

    return this.doc.save();
  }
}

export async function renderPackPdf(pack: Pack): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const italic = await doc.embedFont(StandardFonts.HelveticaOblique);

  doc.setTitle(`${pack.packName} - handover pack`);
  doc.setAuthor(pack.agencyName);
  doc.setSubject(`Client handover pack for ${pack.clientName}`);
  doc.setCreator("HandoffKit");
  doc.setProducer("HandoffKit");

  const writer = new Writer(doc, font, bold, italic, pack);
  writer.cover(pack);

  writer.heading("This pack at a glance");
  writer.paragraph(pack.summary, { size: 10.5, lineHeight: 16, spaceAfter: 8 });
  writer.kv("Client", pack.clientName);
  writer.kv("Prepared by", pack.agencyName);
  writer.kv("Workflow", pack.workflow.name);
  writer.kv("Nodes", String(pack.workflow.nodeCount));
  writer.kv("Triggers", String(pack.workflow.triggerCount));
  writer.kv("AI steps", String(pack.workflow.aiNodeCount));
  writer.kv("Credentials", String(pack.workflow.credentialCount));
  writer.kv("Integrations", String(pack.workflow.integrationCount));
  writer.kv("Error workflow", pack.workflow.hasErrorWorkflow ? "Configured" : "Not configured");
  writer.kv("Readiness", `${readinessLabel(pack)} (${pack.score}/100)`);

  writer.heading("Triggers");
  if (pack.triggers.length === 0) {
    writer.paragraph("No trigger was detected. Confirm how the workflow starts.", { size: 9.5 });
  } else {
    for (const trigger of pack.triggers) {
      writer.bullet(`${trigger.node} (${trigger.kind}): ${trigger.detail}`);
    }
  }

  writer.heading("What it does");
  if (pack.steps.length === 0) {
    writer.paragraph("No steps were detected.", { size: 9.5 });
  } else {
    pack.steps.forEach((step, index) => {
      const suffix = step.disabled ? " [disabled]" : "";
      writer.paragraph(`${index + 1}. ${step.name}${suffix}`, {
        size: 9.5,
        font: bold,
        spaceAfter: 1,
      });
      const detail = [
        step.role,
        step.notes ?? "",
        hasCustomErrorHandling(step.errorHandling)
          ? `Error handling: ${step.errorHandling}.`
          : "",
      ]
        .filter(Boolean)
        .join(" ");
      writer.paragraph(detail, {
        size: 8.8,
        color: MUTED,
        spaceAfter: 5,
        indent: 10,
      });
    });
  }

  writer.heading("AI register");
  if (pack.aiSystems.length === 0) {
    writer.paragraph("No AI steps were detected.", { size: 9.5 });
  } else {
    for (const ai of pack.aiSystems) {
      writer.subheading(ai.node);
      writer.paragraph(`Provider: ${ai.provider} | Model: ${ai.model}`, { size: 9.2, spaceAfter: 2 });
      writer.paragraph(`Purpose: ${ai.purpose}`, { size: 9.2, spaceAfter: 2 });
      writer.paragraph(`Data categories: ${ai.dataCategories.join(", ")}`, { size: 9.2, spaceAfter: 2 });
      writer.paragraph(`Human oversight: ${ai.humanOversight}`, { size: 9.2, spaceAfter: 2 });
      writer.paragraph(`Failure handling: ${ai.failureHandling}`, { size: 9.2, spaceAfter: 2 });
      writer.paragraph(`Can take action: ${ai.canAct ? "Yes. Review the write path." : "No write path detected."}`, {
        size: 9.2,
        spaceAfter: 8,
      });
    }
  }

  writer.heading("Data categories");
  if (pack.dataCategories.length === 0) {
    writer.paragraph("No personal data categories were detected.", { size: 9.5 });
  } else {
    for (const category of pack.dataCategories) {
      writer.bullet(`${category.label}${category.sensitive ? " (sensitive)" : ""}: ${category.evidence.join("; ")}`);
    }
  }

  writer.heading("Credentials");
  if (pack.credentials.length === 0) {
    writer.paragraph("No credentials are referenced in the export.", { size: 9.5 });
  } else {
    for (const credential of pack.credentials) {
      writer.subheading(credential.name);
      writer.paragraph(`Type: ${credential.type} | Used by: ${credential.nodes.join(", ")}`, {
        size: 9.2,
        spaceAfter: 2,
      });
      writer.paragraph(credential.guidance, { size: 9, font: italic, color: MUTED, spaceAfter: 6 });
    }
  }

  writer.heading("Systems");
  writer.paragraph(pack.systems.length === 0 ? "No systems were detected." : pack.systems.join(", "), {
    size: 9.5,
  });

  writer.heading("Findings");
  if (pack.findings.length === 0) {
    writer.paragraph("No findings.", { size: 9.5 });
  } else {
    for (const finding of pack.findings) writer.finding(finding);
  }

  writer.heading("Runbook");
  writer.subheading("Start");
  for (const item of pack.runbook.start) writer.bullet(item);
  writer.subheading("Test before handover");
  for (const item of pack.runbook.test) writer.bullet(item);
  writer.subheading("Monitor");
  for (const item of pack.runbook.monitor) writer.bullet(item);
  writer.subheading("Common failures");
  for (const item of pack.runbook.failures) writer.bullet(item);
  writer.subheading("Change process");
  for (const item of pack.runbook.change) writer.bullet(item);

  writer.heading("Acceptance checklist");
  for (const item of pack.checklist) writer.bullet(`[ ] ${item}`);

  if (Object.keys(pack.settings).length > 0) {
    writer.heading("Workflow settings");
    for (const [key, value] of Object.entries(pack.settings)) writer.kv(key, value);
  }

  if (pack.notes.length > 0) {
    writer.heading("Agency notes");
    for (const note of pack.notes) {
      writer.subheading(note.title);
      writer.paragraph(note.content, { size: 9.2, color: MUTED, spaceAfter: 8 });
    }
  }

  writer.heading("Limitations");
  for (const item of pack.limitations) writer.bullet(item);

  return writer.finish();
}
