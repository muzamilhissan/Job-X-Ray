import { Router } from "express";
import type { AIProvider } from "../ai/AIProvider.js";
import type { HealthResponse } from "@job-xray/shared-types";

export const healthRouter = Router();

healthRouter.get("/", (req, res) => {
  const ai = req.app.locals.ai as AIProvider;
  const body: HealthResponse = {
    ok: true,
    ai: {
      provider: ai.name,
      configured: ai.isConfigured(),
      model: ai.model,
    },
  };
  res.json(body);
});
