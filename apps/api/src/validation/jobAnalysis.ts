import { z } from "zod";

export const JobAnalysisSchema = z.object({
  roleSummary: z.string().max(160),
  matchScore: z.number().min(0).max(100),
  strongMatches: z.array(z.string().max(40)).max(8).default([]),
  skillGaps: z.array(z.string().max(40)).max(8).default([]),
  experienceGap: z
    .object({
      jobAsks: z.string().max(80),
      youHave: z.string().max(80),
      met: z.boolean(),
    })
    .nullable()
    .default(null),
  recommendation: z.enum(["APPLY", "MAYBE", "SKIP"]),
});

function clip(value: unknown, max: number): string {
  return String(value ?? "").replace(/\s+/g, " ").trim().slice(0, max);
}

function clipSkills(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => clip(item, 40))
    .filter(Boolean)
    .slice(0, 8);
}

/** Gemini often overruns string limits — trim to schema instead of failing the scan. */
export function coerceJobAnalysis(raw: unknown): unknown {
  if (!raw || typeof raw !== "object") return raw;
  const o = raw as Record<string, unknown>;

  let experienceGap: unknown = null;
  if (o.experienceGap && typeof o.experienceGap === "object") {
    const g = o.experienceGap as Record<string, unknown>;
    experienceGap = {
      jobAsks: clip(g.jobAsks, 80),
      youHave: clip(g.youHave, 80),
      met: Boolean(g.met),
    };
  }

  const rec = String(o.recommendation ?? "").toUpperCase();
  return {
    roleSummary: clip(o.roleSummary, 160),
    matchScore: Math.min(100, Math.max(0, Number(o.matchScore) || 0)),
    strongMatches: clipSkills(o.strongMatches),
    skillGaps: clipSkills(o.skillGaps),
    experienceGap,
    recommendation: rec === "APPLY" || rec === "MAYBE" || rec === "SKIP" ? rec : "MAYBE",
  };
}
