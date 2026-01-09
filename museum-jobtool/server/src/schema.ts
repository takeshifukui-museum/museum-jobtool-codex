export const jobPostingSchema = {
  type: "object",
  additionalProperties: false,
  required: ["schemaVersion", "source", "company", "position", "job", "requirements", "work", "salary", "insurance", "benefits", "selection", "compliance"],
  properties: {
    schemaVersion: { const: "museum_jobposting_v1" },
    source: {
      type: "object",
      additionalProperties: false,
      required: ["url", "site"],
      properties: {
        url: { type: "string" },
        site: { type: "string" },
        capturedAt: { type: "string" }
      }
    },
    company: {
      type: "object",
      additionalProperties: false,
      required: ["name"],
      properties: {
        name: { type: "string" },
        summary: { type: "string" }
      }
    },
    position: {
      type: "object",
      additionalProperties: false,
      required: ["title"],
      properties: {
        title: { type: "string" },
        employmentType: { type: "string" },
        contractTerm: { type: "string" },
        probation: { type: "string" },
        background: { type: "string" }
      }
    },
    job: {
      type: "object",
      additionalProperties: false,
      required: ["responsibilities"],
      properties: {
        description: { type: "string" },
        responsibilities: { type: "array", items: { type: "string" } },
        notes: { type: "string" }
      }
    },
    requirements: {
      type: "object",
      additionalProperties: false,
      required: ["title", "must", "want"],
      properties: {
        title: { const: "求める経験・スキル" },
        must: { type: "array", items: { type: "string" } },
        want: { type: "array", items: { type: "string" } }
      }
    },
    work: {
      type: "object",
      additionalProperties: false,
      properties: {
        location: { type: "string" },
        hours: { type: "string" },
        breakTime: { type: "string" },
        holidays: { type: "string" },
        remotePolicy: { type: "string" },
        overtime: {
          type: "object",
          additionalProperties: false,
          required: ["exists"],
          properties: {
            exists: { type: "boolean" },
            details: { type: "string" }
          }
        }
      }
    },
    salary: {
      type: "object",
      additionalProperties: false,
      required: ["summary", "details"],
      properties: {
        summary: { type: "string" },
        details: { type: "array", items: { type: "string" } },
        fixedOvertime: {
          type: "object",
          additionalProperties: false,
          required: ["includedHours", "excessPayment"],
          properties: {
            includedHours: { type: "string" },
            excessPayment: { type: "string" },
            notes: { type: "string" }
          }
        }
      }
    },
    insurance: {
      type: "object",
      additionalProperties: false,
      properties: {
        socialInsurance: { type: "string" }
      }
    },
    benefits: {
      type: "object",
      additionalProperties: false,
      required: ["items"],
      properties: {
        items: { type: "array", items: { type: "string" } }
      }
    },
    selection: {
      type: "object",
      additionalProperties: false,
      properties: {
        process: { type: "string" }
      }
    },
    compliance: {
      type: "object",
      additionalProperties: false,
      required: ["forbiddenDetected", "warnings"],
      properties: {
        forbiddenDetected: { type: "array", items: { type: "string" } },
        warnings: { type: "array", items: { type: "string" } }
      }
    }
  }
} as const;

export type JobPosting = {
  schemaVersion: "museum_jobposting_v1";
  source: { url: string; site: string; capturedAt?: string };
  company: { name: string; summary?: string };
  position: { title: string; employmentType?: string; contractTerm?: string; probation?: string; background?: string };
  job: { description?: string; responsibilities: string[]; notes?: string };
  requirements: { title: "求める経験・スキル"; must: string[]; want: string[] };
  work: {
    location?: string;
    hours?: string;
    breakTime?: string;
    holidays?: string;
    remotePolicy?: string;
    overtime?: { exists: boolean; details?: string };
  };
  salary: {
    summary: string;
    details: string[];
    fixedOvertime?: { includedHours: string; excessPayment: string; notes?: string };
  };
  insurance: { socialInsurance?: string };
  benefits: { items: string[] };
  selection: { process?: string };
  compliance: { forbiddenDetected: string[]; warnings: string[] };
};
