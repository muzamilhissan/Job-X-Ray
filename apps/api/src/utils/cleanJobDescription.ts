const NOISE_PATTERNS = [
  /cookie\s+(policy|settings|preferences)/gi,
  /accept\s+all\s+cookies/gi,
  /we\s+use\s+cookies/gi,
  /sign\s+in\s+to\s+continue/gi,
  /create\s+an?\s+account/gi,
  /related\s+jobs?/gi,
  /recommended\s+jobs?/gi,
  /people\s+also\s+viewed/gi,
  /similar\s+jobs?/gi,
  /report\s+this\s+job/gi,
  /share\s+this\s+job/gi,
  /follow\s+us\s+on/gi,
  /subscribe\s+to\s+(our\s+)?newsletter/gi,
  /©\s*\d{4}/g,
];

/** Keep prompts cheap — hard cap for Gemini free tier */
const MAX_CHARS = 6_000;

/** Strip boilerplate and normalize job description text before AI. */
export function cleanJobDescription(text: string): string {
  let out = text
    .replace(/\u00a0/g, " ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();

  for (const re of NOISE_PATTERNS) {
    out = out.replace(re, " ");
  }

  const lines = out.split("\n").map((l) => l.trim());
  const deduped: string[] = [];
  let prev = "";
  for (const line of lines) {
    if (!line) {
      if (prev !== "") deduped.push("");
      prev = "";
      continue;
    }
    if (line === prev) continue;
    deduped.push(line);
    prev = line;
  }
  out = deduped.join("\n").replace(/\n{3,}/g, "\n\n").trim();

  if (out.length > MAX_CHARS) {
    out = `${out.slice(0, MAX_CHARS)}\n[truncated]`;
  }

  return out;
}
