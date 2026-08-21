import { config } from "dotenv";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import pino from "pino";
import { pinoHttp } from "pino-http";
import { healthRouter } from "./routes/health.js";
import { analyzeRouter } from "./routes/analyze.js";
import { cvRouter } from "./routes/cv.js";
import { coverLetterRouter } from "./routes/coverLetter.js";
import { createAIProvider } from "./ai/createProvider.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, "../.env") });

const log = pino({ level: process.env.LOG_LEVEL ?? "info" });
const port = Number(process.env.PORT ?? 8787);
const host =
  process.env.HOST ?? (process.env.NODE_ENV === "production" ? "0.0.0.0" : "127.0.0.1");

const ai = createAIProvider();

const app = express();
app.use(helmet());
app.use(
  cors({
    origin: ["chrome-extension://*", "http://localhost:*"],
    // Chrome extensions send origin chrome-extension://<id>
    // Express cors doesn't support wildcards well — allow any chrome-extension
  }),
);
// Override CORS for extension origins
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (!origin || origin.startsWith("chrome-extension://") || origin.startsWith("http://localhost")) {
    res.setHeader("Access-Control-Allow-Origin", origin ?? "*");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  }
  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }
  next();
});
app.use(express.json({ limit: "2mb" }));
app.use(pinoHttp({ logger: log }));

app.locals.ai = ai;

app.use("/health", healthRouter);
app.use("/api/analyze-job", analyzeRouter);
app.use("/api/cv", cvRouter);
app.use("/api/cover-letter", coverLetterRouter);

app.use(
  (
    err: unknown,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
    log.error({ err }, "Unhandled error");
    res.status(500).json({
      success: false,
      error: err instanceof Error ? err.message : "Internal server error",
      code: "INTERNAL",
    });
  },
);

app.listen(port, host, () => {
  log.info({ host, port, provider: ai.name, configured: ai.isConfigured() }, "Job X-Ray API listening");
});
