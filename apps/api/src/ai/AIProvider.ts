import type { AnalyzeJobRequest, CoverLetterRequest, JobAnalysis } from "@job-xray/shared-types";

export interface AIProvider {
  readonly name: string;
  isConfigured(): boolean;
  analyzeJob(input: AnalyzeJobRequest): Promise<JobAnalysis>;
  draftCoverLetter(input: CoverLetterRequest): Promise<string>;
}
