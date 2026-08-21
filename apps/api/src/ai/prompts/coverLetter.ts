import type { CoverLetterRequest } from "@job-xray/shared-types";

const MAX_JOB = 5_000;
const MAX_CV = 3_500;

export function buildCoverLetterPrompt(input: CoverLetterRequest): string {
  const { job, cvText, matchScore, strongMatches, skillGaps } = input;

  const matchBits = [
    matchScore != null ? `Match score: ${Math.round(matchScore)}%` : null,
    strongMatches?.length ? `Strengths to lean on: ${strongMatches.slice(0, 6).join(", ")}` : null,
    skillGaps?.length ? `Gaps to avoid overclaiming: ${skillGaps.slice(0, 4).join(", ")}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  return `Write a short cover letter for this job using the candidate's CV.

Return ONLY the letter text. No JSON. No markdown. No title line. No commentary before or after.

Hard rules:
- Sound like a real person wrote it, not a chatbot
- Never use em dashes, en dashes, or double hyphens (no —, –, or --)
- No buzzword stacks, no "I am writing to express my interest", no "leverage", no "synergy", no "passionate about"
- Calm, direct, specific
- Greeting + up to 3 short paragraphs + simple sign-off
- Use only skills/experience that appear in the CV
- Mention 2-3 concrete matches to the role
- Do not invent skills the CV does not have
- Plain punctuation only: periods, commas, apostrophes

JOB:
Title: ${job.title ?? "N/A"}
Company: ${job.company ?? "N/A"}
Location: ${job.location ?? "N/A"}

${(job.description ?? "").slice(0, MAX_JOB)}

${matchBits ? `MATCH CONTEXT:\n${matchBits}\n` : ""}
CV:
${cvText.trim().slice(0, MAX_CV)}`;
}
