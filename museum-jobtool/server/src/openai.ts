import OpenAI from "openai";
import { jobPostingSchema, JobPosting } from "./schema.js";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export type GenerateInput = {
  url: string;
  title: string;
  rawText: string;
  siteHint: string;
};

const buildJobPrompt = (input: GenerateInput) => {
  return `あなたは求人票の構造化エキスパートです。次のWebページ本文をもとに、指定のJSONスキーマで求人票を作成してください。

# 入力情報
URL: ${input.url}
タイトル: ${input.title}
サイトヒント: ${input.siteHint}

# 本文
${input.rawText}

# 出力ルール
- JSONスキーマに厳密準拠
- schemaVersion は museum_jobposting_v1
- salary.summary は必須。空の場合は最も近い給与情報を要約し、詳細が無ければ details を空配列に
- overtime は情報が無い場合キー自体を出さない
- compliance.forbiddenDetected/warnings は空配列でよい
- 禁止転載(性別/年齢/国籍/病歴)は含めない
`;
};

export const generateJobPosting = async (input: GenerateInput): Promise<JobPosting> => {
  const response = await client.responses.create({
    model: process.env.MODEL || "gpt-4.1-mini",
    input: [
      {
        role: "system",
        content: [
          {
            type: "text",
            text: "あなたは求人票JSONを生成するアシスタントです。"
          }
        ]
      },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: buildJobPrompt(input)
          }
        ]
      }
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "museum_jobposting_v1",
        schema: jobPostingSchema,
        strict: true
      }
    }
  });

  const outputText = response.output_text?.trim() ?? "";
  if (!outputText) {
    throw new Error("LLM_INVALID_JSON");
  }
  try {
    return JSON.parse(outputText) as JobPosting;
  } catch {
    throw new Error("LLM_INVALID_JSON");
  }
};

export const generateScoutText = async (job: JobPosting): Promise<string> => {
  const response = await client.responses.create({
    model: process.env.MODEL || "gpt-4.1-mini",
    input: [
      {
        role: "system",
        content: [
          {
            type: "text",
            text:
              "あなたはスカウト文の作成者です。柔らかく寄り添う文体で、断定評価は避けます。求人URLは本文に入れません。署名は必ず指定します。"
          }
        ]
      },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `次の求人票JSONを元に、スカウト文を作成してください。\n\n${JSON.stringify(job, null, 2)}\n\n署名:\n株式会社Museum\n代表取締役\n福井 毅`
          }
        ]
      }
    ]
  });

  return response.output_text?.trim() ?? "";
};
