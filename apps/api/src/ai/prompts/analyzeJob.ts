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
    : "CV: (none — cannot score fit; matchScore = 0; strongMatches []; recommendation SKIP)";

  return `Job match card. Be brief. JSON only. Score harshly.

Scoring (how hireable THIS CV is for THIS job — not how nice the posting is):
- Missing the core profession, license, or degree the job requires (NP, RN, MD, lawyer, CPA, etc.) → matchScore 0–8, SKIP, strongMatches []
- Zero strongMatches → matchScore max 8, SKIP
- Most must-haves missing → max 20, SKIP
- APPLY only if they could realistically get an interview (≥70)
- Do not give points for generic traits (communication, teamwork, fast learner, "AI interest")
- strongMatches / skillGaps = short skill names only, from CV vs job
- Do not invent skills

JOB:
${jobBlock}

${cv}`;
}
