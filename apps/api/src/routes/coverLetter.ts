import { Router } from "express";
import { z } from "zod";
import type { AIProvider } from "../ai/AIProvider.js";
import { cleanJobDescription } from "../utils/cleanJobDescription.js";

export const coverLetterRouter = Router();

const jobSchema = z.object({
  title: z.string().optional(),
  company: z.string().optional(),
  location: z.string().optional(),
  salary: z.string().optional(),
  employmentType: z.string().optional(),
  description: z.string().optional(),
  url: z.string().min(1),
  platform: z.string().min(1),
});

const bodySchema = z.object({
  job: jobSchema,
  cvText: z.string().min(40),
  matchScore: z.number().min(0).max(100).optional(),
  strongMatches: z.array(z.string()).optional(),
  skillGaps: z.array(z.string()).optional(),
});

coverLetterRouter.post("/", async (req, res, next) => {
  try {
    const parsed = bodySchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        error: "Upload your CV and scan a job before drafting a cover letter.",
        code: "VALIDATION",
      });
      return;
    }

    const ai = req.app.locals.ai as AIProvider;
    if (!ai.isConfigured()) {
      res.status(503).json({
        success: false,
        error: "AI is not configured.",
        code: "AI_NOT_CONFIGURED",
      });
      return;
    }

    const { job, cvText, matchScore, strongMatches, skillGaps } = parsed.data;
    const letter = await ai.draftCoverLetter({
      job: {
        ...job,
        description: job.description ? cleanJobDescription(job.description) : undefined,
      },
      cvText: cvText.slice(0, 3_500),
      matchScore,
      strongMatches,
      skillGaps,
    });

    res.json({ success: true, letter });
  } catch (err) {
    next(err);
  }
});
