import type { RawJobData } from "@job-xray/shared-types";
import type { JobExtractor } from "./types";
import { linkedInExtractor } from "./linkedin";
import { genericExtractor } from "./generic";

const extractors: JobExtractor[] = [linkedInExtractor, genericExtractor];

export function extractJob(doc: Document = document, url: string = location.href): RawJobData {
  const match = extractors.find((e) => e.canHandle(url, doc)) ?? genericExtractor;
  return match.extract(doc, url);
}
