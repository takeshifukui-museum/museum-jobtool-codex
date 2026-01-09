import fs from "node:fs";
import path from "node:path";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import { JobPosting } from "./schema.js";
import { listToText } from "./extract.js";

const keepLabels = ["賃金", "給与", "業務内容", "求める経験・スキル"];

const removeEmptyRows = (docxBuffer: Buffer): Buffer => {
  const zip = new PizZip(docxBuffer);
  const documentXml = zip.file("word/document.xml")?.asText();
  if (!documentXml) {
    return docxBuffer;
  }

  const rows = documentXml.match(/<w:tr[\s\S]*?<\/w:tr>/g) ?? [];
  const cleanedRows = rows.filter((row) => {
    const cells = row.match(/<w:tc[\s\S]*?<\/w:tc>/g) ?? [];
    if (cells.length < 2) {
      return true;
    }
    const getText = (cell: string) => {
      const texts = cell.match(/<w:t[^>]*>[\s\S]*?<\/w:t>/g) ?? [];
      return texts
        .map((text) => text.replace(/<w:t[^>]*>/g, "").replace(/<\/w:t>/g, ""))
        .join("")
        .replace(/\s+/g, " ")
        .trim();
    };
    const leftText = getText(cells[0]);
    const rightText = getText(cells[1]);
    const shouldKeep = keepLabels.some((label) => leftText.includes(label));
    if (shouldKeep) {
      return true;
    }
    return rightText !== "";
  });

  const updatedXml = documentXml.replace(/<w:tr[\s\S]*?<\/w:tr>/g, () => cleanedRows.shift() ?? "");
  zip.file("word/document.xml", updatedXml);
  return zip.generate({ type: "nodebuffer" });
};

export const renderJobDocx = (job: JobPosting, templatePath: string): Buffer => {
  const template = fs.readFileSync(templatePath);
  const zip = new PizZip(template);
  const doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true });

  const fixedOvertimeText = job.salary.fixedOvertime
    ? [
        `固定残業代: ${job.salary.fixedOvertime.includedHours}`,
        `超過分: ${job.salary.fixedOvertime.excessPayment}`,
        job.salary.fixedOvertime.notes
      ]
        .filter(Boolean)
        .join("\n")
    : "";

  const overtimeText = job.work.overtime
    ? job.work.overtime.details
      ? `時間外労働: ${job.work.overtime.details}`
      : job.work.overtime.exists
        ? "時間外労働あり"
        : "時間外労働なし"
    : "";

  const data = {
    company: { name: job.company.name },
    position: { title: job.position.title, contractTerm: job.position.contractTerm ?? "" },
    job: {
      responsibilities_text: listToText(job.job.responsibilities),
      notes: job.job.notes ?? ""
    },
    requirements: {
      must_text: listToText(job.requirements.must),
      want_text: listToText(job.requirements.want)
    },
    work: {
      location: job.work.location ?? "",
      hours: job.work.hours ?? "",
      breakTime: job.work.breakTime ?? "",
      holidays: job.work.holidays ?? "",
      overtime_text: overtimeText
    },
    salary: {
      summary: job.salary.summary,
      details_text: listToText(job.salary.details),
      fixedOvertime_text: fixedOvertimeText
    },
    insurance: { socialInsurance: job.insurance.socialInsurance ?? "" },
    benefits: { items_text: listToText(job.benefits.items) },
    selection: { process: job.selection.process ?? "" }
  };

  doc.render(data);
  const rendered = doc.getZip().generate({ type: "nodebuffer" });
  return removeEmptyRows(rendered);
};

export const resolveTemplatePath = () => {
  return path.resolve(__dirname, "../../templates/museum_template.docx");
};
