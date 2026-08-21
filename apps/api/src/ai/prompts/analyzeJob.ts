import type { AnalyzeJobRequest } from "@job-xray/shared-types";

const MAX_JOB = 4_000;
const MAX_CV = 2_500;

export function buildAnalyzeJobPrompt(input: AnalyzeJobRequest): string {
  const { job, cvText } = input;

  const jobBlock = [
    `Title: ${job.title ?? "N/A"}`,
    `Company: ${job.company ?? "N/A"}`,
    `Location: ${job.location ?? "N/A"}`,
    "",
    (job.description ?? "").slice(0, MAX_JOB),
  ].join("\n");

  const cv = cvText?.trim()
    ? `CV:\n${cvText.trim().slice(0, MAX_CV)}`
    : "CV: (none — estimate match from job alone; set experienceGap null; matchScore = role clarity only, max 50)";

  return `Job match card. Be brief. JSON only.

Rules:
- strongMatches / skillGaps = short skill names only
- recommendation: APPLY (≥70), MAYBE (45-69), SKIP (<45)
- Do not invent skills not in CV or job

JOB:
${jobBlock}

${cv}`;
}
