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
