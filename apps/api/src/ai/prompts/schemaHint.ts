export const jobAnalysisSchemaHint = `Return ONLY this compact JSON (no other keys, keep lists short):
{
  "roleSummary": "≤12 words",
  "matchScore": 0-100 (harsh; wrong profession = 0-8),
  "strongMatches": ["React", "Node.js"],
  "skillGaps": ["AWS", "Docker"],
  "experienceGap": { "jobAsks": "3 years", "youHave": "2 years", "met": false } | null,
  "recommendation": "APPLY" | "MAYBE" | "SKIP"
}
Max 6 strongMatches, max 6 skillGaps. Skill names only — no sentences.`;
