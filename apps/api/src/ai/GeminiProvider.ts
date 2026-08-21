import {
  GoogleGenerativeAI,
  SchemaType,
  type ResponseSchema,
} from "@google/generative-ai";
import type {
  AnalyzeJobRequest,
  CoverLetterRequest,
  JobAnalysis,
} from "@job-xray/shared-types";
import type { AIProvider } from "./AIProvider.js";
import { buildAnalyzeJobPrompt } from "./prompts/analyzeJob.js";
import { buildCoverLetterPrompt } from "./prompts/coverLetter.js";
import { jobAnalysisSchemaHint } from "./prompts/schemaHint.js";
import { JobAnalysisSchema } from "../validation/jobAnalysis.js";

const DEFAULT_MODEL = "gemini-3.5-flash-lite";
const REQUEST_TIMEOUT_MS = 20_000;

/** Retired IDs still sitting in Render/.env → current lite model. */
const MODEL_ALIASES: Record<string, string> = {
  "gemini-2.5-flash-lite": "gemini-3.5-flash-lite",
  "gemini-2.0-flash-lite": "gemini-3.5-flash-lite",
  "gemini-2.5-flash": "gemini-3.5-flash",
};

function resolveModelName(requested: string): string {
  return MODEL_ALIASES[requested] ?? requested;
}

/** Stay on the configured fast model. Falling back to Flash / 3.6 is what made scans feel slow. */
const RETRY_DELAY_MS = 350;

const jobAnalysisResponseSchema = {
  type: SchemaType.OBJECT,
  properties: {
    roleSummary: { type: SchemaType.STRING },
    matchScore: { type: SchemaType.NUMBER },
    strongMatches: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
    },
    skillGaps: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
    },
    experienceGap: {
      type: SchemaType.OBJECT,
      nullable: true,
      properties: {
        jobAsks: { type: SchemaType.STRING },
        youHave: { type: SchemaType.STRING },
        met: { type: SchemaType.BOOLEAN },
      },
    },
    recommendation: { type: SchemaType.STRING },
  },
  required: ["roleSummary", "matchScore", "strongMatches", "skillGaps", "recommendation"],
} as unknown as ResponseSchema;

export class GeminiProvider implements AIProvider {
  readonly name = "gemini";
  readonly model: string;
  private readonly client: GoogleGenerativeAI | null;
  private readonly modelName: string;

  constructor(apiKey: string | undefined, modelName = process.env.GEMINI_MODEL ?? DEFAULT_MODEL) {
    this.client = apiKey ? new GoogleGenerativeAI(apiKey) : null;
    this.modelName = resolveModelName(modelName);
    this.model = this.modelName;
  }

  isConfigured(): boolean {
    return Boolean(this.client);
  }

  async analyzeJob(input: AnalyzeJobRequest): Promise<JobAnalysis> {
    return this.withFastRetry(() => this.analyzeWithModel(this.modelName, input));
  }

  async draftCoverLetter(input: CoverLetterRequest): Promise<string> {
    return this.withFastRetry(() => this.coverLetterWithModel(this.modelName, input));
  }

  private async withFastRetry<T>(fn: () => Promise<T>): Promise<T> {
    if (!this.client) {
      throw new Error("GEMINI_API_KEY is not set. Add it to apps/api/.env");
    }

    try {
      return await fn();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (!/503|high demand|overloaded|unavailable|RESOURCE_EXHAUSTED/i.test(msg)) {
        throw err;
      }
      await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
      return await fn();
    }
  }

  private async analyzeWithModel(
    modelName: string,
    input: AnalyzeJobRequest,
  ): Promise<JobAnalysis> {
    const text = await this.generateJson(
      modelName,
      `${jobAnalysisSchemaHint}\n\n${buildAnalyzeJobPrompt(input)}`,
    );
    let raw: unknown;
    try {
      raw = JSON.parse(this.extractJsonObject(text));
    } catch {
      throw new Error("The model returned incomplete JSON. Try X-Ray again.");
    }
    const parsed = JobAnalysisSchema.safeParse(raw);
    if (!parsed.success) {
      throw new Error(
        `Invalid AI response shape: ${parsed.error.issues[0]?.message ?? "unknown"}`,
      );
    }
    return parsed.data;
  }

  private async coverLetterWithModel(
    modelName: string,
    input: CoverLetterRequest,
  ): Promise<string> {
    const text = await this.generateText(modelName, buildCoverLetterPrompt(input), 0.5);
    const letter = sanitizeCoverLetter(extractCoverLetterText(text));
    if (letter.length < 40) {
      throw new Error("Cover letter came back empty. Try again.");
    }
    return letter;
  }

  private async generateJson(
    modelName: string,
    prompt: string,
    _temperature = 0.2,
  ): Promise<string> {
    const model = this.client!.getGenerativeModel(
      {
        model: modelName,
        generationConfig: {
          maxOutputTokens: 8192,
          responseMimeType: "application/json",
          responseSchema: jobAnalysisResponseSchema,
          thinkingConfig: { thinkingLevel: "minimal" },
        } as Record<string, unknown>,
      },
      { timeout: REQUEST_TIMEOUT_MS },
    );

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });

    return result.response.text();
  }

  private async generateText(
    modelName: string,
    prompt: string,
    _temperature = 0.5,
  ): Promise<string> {
    const model = this.client!.getGenerativeModel(
      {
        model: modelName,
        generationConfig: {
          maxOutputTokens: 2048,
          thinkingConfig: { thinkingLevel: "minimal" },
        } as Record<string, unknown>,
      },
      { timeout: REQUEST_TIMEOUT_MS },
    );

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });

    return result.response.text();
  }

  private extractJsonObject(text: string): string {
    const cleaned = text.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start === -1 || end === -1 || end <= start) return cleaned;
    return cleaned.slice(start, end + 1);
  }
}

/** Prefer plain letter text; fall back to JSON { letter } if the model returns that. */
export function extractCoverLetterText(raw: string): string {
  let text = raw.trim();
  text = text.replace(/^```(?:json|text|markdown)?\s*/i, "").replace(/```$/i, "").trim();

  if (text.startsWith("{")) {
    try {
      const parsed = JSON.parse(text) as { letter?: unknown };
      if (typeof parsed.letter === "string" && parsed.letter.trim()) {
        return parsed.letter;
      }
    } catch {
      // Gemini often returns broken JSON for multiline letters — pull "letter" value loosely
      const m = text.match(/"letter"\s*:\s*"((?:\\.|[^"\\])*)"/s);
      if (m?.[1]) {
        return m[1].replace(/\\n/g, "\n").replace(/\\"/g, '"').replace(/\\\\/g, "\\");
      }
    }
  }

  // Drop accidental labels
  text = text.replace(/^cover letter\s*:?\s*/i, "").trim();
  return text;
}

/** Strip AI-ish dash habits even if the model slips */
export function sanitizeCoverLetter(letter: string): string {
  return letter
    .replace(/\u2014/g, ",") // em dash
    .replace(/\u2013/g, ",") // en dash
    .replace(/ -- /g, ", ")
    .replace(/--/g, ", ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
