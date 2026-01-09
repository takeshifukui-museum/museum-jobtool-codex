import "dotenv/config";
import express from "express";
import cors from "cors";
import { generateJobPosting, generateScoutText } from "./openai.js";
import { sanitizeJobPosting } from "./sanitize.js";
import { normalizeRawText } from "./extract.js";
import { renderJobDocx, resolveTemplatePath } from "./word.js";
import { JobPosting } from "./schema.js";

const app = express();
const port = Number(process.env.PORT || 3000);
const allowedOrigin = process.env.ALLOWED_ORIGIN;

app.use(
  cors({
    origin: (origin, callback) => {
      if (!allowedOrigin) {
        return callback(null, true);
      }
      if (!origin || origin === allowedOrigin) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    }
  })
);
app.use(express.json({ limit: "4mb" }));

app.post("/api/generate", async (req, res) => {
  try {
    const { url, title, rawText, siteHint } = req.body ?? {};
    if (!rawText || String(rawText).trim() === "") {
      return res.status(400).json({ error: { code: "TEXT_EXTRACTION_EMPTY", message: "rawText is empty" } });
    }

    const normalizedText = normalizeRawText(String(rawText));
    const job = await generateJobPosting({
      url: String(url ?? ""),
      title: String(title ?? ""),
      rawText: normalizedText,
      siteHint: String(siteHint ?? "unknown")
    });

    const jobWithCompliance: JobPosting = {
      ...job,
      compliance: job.compliance ?? { forbiddenDetected: [], warnings: [] }
    };

    const { sanitized, forbiddenDetected } = sanitizeJobPosting(jobWithCompliance);
    sanitized.compliance.forbiddenDetected = Array.from(new Set([...sanitized.compliance.forbiddenDetected, ...forbiddenDetected]));

    const warnings: string[] = [];
    if (!sanitized.job.responsibilities || sanitized.job.responsibilities.length === 0) {
      warnings.push("RESPONSIBILITIES_EMPTY");
    }
    if (!sanitized.requirements.must || sanitized.requirements.must.length === 0) {
      warnings.push("REQUIREMENTS_MUST_EMPTY");
    }

    if (!sanitized.salary.summary || sanitized.salary.summary.trim() === "") {
      return res.status(400).json({ error: { code: "SALARY_REQUIRED", message: "salary.summary is required" } });
    }

    if (sanitized.work.overtime && sanitized.work.overtime.exists === false && !sanitized.work.overtime.details) {
      delete sanitized.work.overtime;
    }

    const scoutText = await generateScoutText(sanitized);
    const templatePath = resolveTemplatePath();
    let docxBuffer: Buffer;
    try {
      docxBuffer = renderJobDocx(sanitized, templatePath);
    } catch (error) {
      return res.status(500).json({ error: { code: "TEMPLATE_RENDER_FAIL", message: "docx render failed" } });
    }

    const docxBase64 = docxBuffer.toString("base64");
    return res.json({
      docx: docxBase64,
      scoutText,
      meta: {
        warnings: [...warnings, ...sanitized.compliance.warnings]
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const code = message === "LLM_INVALID_JSON" ? "LLM_INVALID_JSON" : "INTERNAL_ERROR";
    return res.status(500).json({ error: { code, message } });
  }
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
