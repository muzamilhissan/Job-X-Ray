import { Router } from "express";
import multer from "multer";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const pdf = require("pdf-parse") as (buf: Buffer) => Promise<{
  text: string;
  numpages: number;
}>;

export const cvRouter = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype !== "application/pdf") {
      cb(new Error("Only PDF files are allowed"));
      return;
    }
    cb(null, true);
  },
});

/** Parse uploaded PDF CV → plain text (for later analyze-job + chrome.storage) */
cvRouter.post("/parse", upload.single("cv"), async (req, res, next) => {
  try {
    if (!req.file) {
      res.status(400).json({
        success: false,
        error: "Missing PDF file field: cv",
        code: "VALIDATION",
      });
      return;
    }

    const data = await pdf(req.file.buffer);
    const text = (data.text ?? "").replace(/\s+\n/g, "\n").trim();

    if (!text) {
      res.status(422).json({
        success: false,
        error: "Could not extract text from this PDF. Try a text-based PDF (not a scanned image).",
        code: "CV_EMPTY",
      });
      return;
    }

    res.json({
      success: true,
      text,
      meta: {
        pages: data.numpages,
        bytes: req.file.size,
        filename: req.file.originalname,
      },
    });
  } catch (err) {
    next(err);
  }
});
