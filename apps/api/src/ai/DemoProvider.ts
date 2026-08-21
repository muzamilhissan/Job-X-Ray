import type { AnalyzeJobRequest, CoverLetterRequest, JobAnalysis } from "@job-xray/shared-types";
import type { AIProvider } from "./AIProvider.js";

/** Offline mock so UI can be built without calling Gemini */
export class DemoProvider implements AIProvider {
  readonly name = "demo";

  isConfigured(): boolean {
    return true;
  }

  async analyzeJob(input: AnalyzeJobRequest): Promise<JobAnalysis> {
    const hasCv = Boolean(input.cvText?.trim());
    return {
      roleSummary: input.job.title ?? "Demo role",
      matchScore: hasCv ? 84 : 40,
      strongMatches: ["React", "Node.js", "PostgreSQL", "REST APIs"],
      skillGaps: ["AWS", "Docker"],
      experienceGap: hasCv
        ? { jobAsks: "3 years", youHave: "2 years", met: false }
        : null,
      recommendation: hasCv ? "APPLY" : "MAYBE",
    };
  }

  async draftCoverLetter(input: CoverLetterRequest): Promise<string> {
    const company = input.job.company ?? "your team";
    const title = input.job.title ?? "this role";
    return `Hi,

I'm interested in the ${title} role at ${company}. I've spent the last couple of years building with React and Node, including production APIs and PostgreSQL work that lines up with what you're hiring for.

Happy to share more detail or walk through a recent project if useful.

Thanks,
[Your name]`;
  }
}
