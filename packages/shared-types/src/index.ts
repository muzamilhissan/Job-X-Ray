/** Raw job data extracted from a page */
export interface RawJobData {
  title?: string;
  company?: string;
  location?: string;
  salary?: string;
  employmentType?: string;
  description?: string;
  requirements?: string[];
  responsibilities?: string[];
  benefits?: string[];
  url: string;
  platform: string;
}

export type Recommendation = "APPLY" | "MAYBE" | "SKIP";

/**
 * Light fixed template — same shape for every job.
 * Designed to keep Gemini input/output tokens low.
 */
export interface JobAnalysis {
  /** One short line about the role */
  roleSummary: string;
  matchScore: number;
  strongMatches: string[];
  skillGaps: string[];
  experienceGap: {
    jobAsks: string;
    youHave: string;
    met: boolean;
  } | null;
  recommendation: Recommendation;
}

export interface AnalyzeJobRequest {
  job: RawJobData;
  /** Plain text extracted from CV */
  cvText?: string;
}

export interface AnalyzeJobResponse {
  success: true;
  analysis: JobAnalysis;
}

export interface CoverLetterRequest {
  job: RawJobData;
  cvText: string;
  /** Optional match context from a prior scan */
  matchScore?: number;
  strongMatches?: string[];
  skillGaps?: string[];
}

export interface CoverLetterResult {
  letter: string;
}

export interface CoverLetterResponse {
  success: true;
  letter: string;
}

export interface ApiErrorResponse {
  success: false;
  error: string;
  code?: string;
}

export interface HealthResponse {
  ok: boolean;
  ai: {
    provider: string;
    configured: boolean;
  };
}
