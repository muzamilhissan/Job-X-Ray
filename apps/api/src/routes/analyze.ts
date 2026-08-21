import { Router } from "express";
import { z } from "zod";
import type { AIProvider } from "../ai/AIProvider.js";
import { cleanJobDescription } from "../utils/cleanJobDescription.js";

export const analyzeRouter = Router();

const jobSchema = z.object({
  title: z.string().optional(),
  company: z.string().optional(),
  location: z.string().optional(),
  salary: z.string().optional(),
  employmentType: z.string().optional(),
  description: z.string().optional(),
  requirements: z.array(z.string()).optional(),
  responsibilities: z.array(z.string()).optional(),
  benefits: z.array(z.string()).optional(),
  url: z.string().min(1),
  platform: z.string().min(1),
});

const bodySchema = z.object({
  job: jobSchema,
  cvText: z.string().optional(),
});

analyzeRouter.post("/", async (req, res, next) => {
  try {
    const parsed = bodySchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        error: parsed.error.flatten(),
        code: "VALIDATION",
      });
      return;
    }

    const ai = req.app.locals.ai as AIProvider;
    if (!ai.isConfigured()) {
      res.status(503).json({
        success: false,
        error: "AI provider is not configured. Set GEMINI_API_KEY in apps/api/.env",
        code: "AI_NOT_CONFIGURED",
      });
      return;
    }

    const { job, cvText } = parsed.data;
    const cleanedJob = {
      ...job,
      description: job.description ? cleanJobDescription(job.description) : undefined,
    };

    if (!cleanedJob.description && !cleanedJob.title) {
      res.status(422).json({
        success: false,
        error: "No job title or description to analyze.",
        code: "EMPTY_JOB",
      });
      return;
    }

    const started = Date.now();
    const analysis = await ai.analyzeJob({
      job: cleanedJob,
      cvText: cvText?.slice(0, 2_500),
    });
    req.log.info({ ms: Date.now() - started }, "analyzeJob");
    res.json({ success: true, analysis });
  } catch (err) {
    next(err);
  }
});
