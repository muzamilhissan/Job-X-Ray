import type { RawJobData } from "@job-xray/shared-types";

export interface JobExtractor {
  readonly platform: string;
  canHandle(url: string, document: Document): boolean;
  extract(document: Document, url: string): RawJobData;
}

export function textOf(el: Element | null | undefined): string | undefined {
  const t = el?.textContent?.replace(/\s+/g, " ").trim();
  return t || undefined;
}

export function firstText(selectors: string[], root: ParentNode = document): string | undefined {
  for (const sel of selectors) {
    const el = root.querySelector(sel);
    const t = textOf(el);
    if (t) return t;
  }
  return undefined;
}
