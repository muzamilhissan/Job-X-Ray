import type { RawJobData } from "@job-xray/shared-types";
import { type JobExtractor, firstText, textOf } from "./types";

interface JsonLdJob {
  "@type"?: string | string[];
  title?: string;
  description?: string;
  hiringOrganization?: { name?: string } | string;
  jobLocation?:
    | { address?: { addressLocality?: string; addressRegion?: string; addressCountry?: string } | string }
    | Array<unknown>;
  baseSalary?: {
    currency?: string;
    value?: { value?: number | string; minValue?: number; maxValue?: number; unitText?: string } | number | string;
  };
  employmentType?: string | string[];
}

function typeIsJobPosting(t: string | string[] | undefined): boolean {
  if (!t) return false;
  const arr = Array.isArray(t) ? t : [t];
  return arr.some((x) => String(x).toLowerCase().includes("jobposting"));
}

function flattenJsonLd(data: unknown): JsonLdJob[] {
  if (!data) return [];
  if (Array.isArray(data)) return data.flatMap(flattenJsonLd);
  if (typeof data === "object") {
    const obj = data as Record<string, unknown>;
    if (obj["@graph"]) return flattenJsonLd(obj["@graph"]);
    if (typeIsJobPosting(obj["@type"] as string | string[])) return [obj as JsonLdJob];
  }
  return [];
}

function parseJsonLdJobs(doc: Document): JsonLdJob | null {
  const scripts = doc.querySelectorAll('script[type="application/ld+json"]');
  for (const script of scripts) {
    try {
      const raw = JSON.parse(script.textContent ?? "");
      const jobs = flattenJsonLd(raw);
      if (jobs[0]) return jobs[0];
    } catch {
      /* ignore bad json-ld */
    }
  }
  return null;
}

function companyFromLd(job: JsonLdJob): string | undefined {
  const org = job.hiringOrganization;
  if (!org) return undefined;
  if (typeof org === "string") return org;
  return org.name;
}

function locationFromLd(job: JsonLdJob): string | undefined {
  const loc = job.jobLocation;
  if (!loc) return undefined;
  const first = Array.isArray(loc) ? loc[0] : loc;
  if (!first || typeof first !== "object") return undefined;
  const address = (first as { address?: unknown }).address;
  if (typeof address === "string") return address;
  if (address && typeof address === "object") {
    const a = address as {
      addressLocality?: string;
      addressRegion?: string;
      addressCountry?: string;
    };
    return [a.addressLocality, a.addressRegion, a.addressCountry].filter(Boolean).join(", ") || undefined;
  }
  return undefined;
}

function salaryFromLd(job: JsonLdJob): string | undefined {
  const s = job.baseSalary;
  if (!s) return undefined;
  const currency = s.currency ?? "";
  const v = s.value;
  if (typeof v === "number" || typeof v === "string") return `${currency} ${v}`.trim();
  if (v && typeof v === "object") {
    if (v.minValue != null && v.maxValue != null) {
      return `${currency} ${v.minValue}–${v.maxValue} ${v.unitText ?? ""}`.trim();
    }
    if (v.value != null) return `${currency} ${v.value} ${v.unitText ?? ""}`.trim();
  }
  return undefined;
}

function stripHtml(html: string): string {
  const tmp = document.createElement("div");
  tmp.innerHTML = html;
  return (tmp.textContent ?? "").replace(/\s+/g, " ").trim();
}

function detectPlatform(url: string): string {
  try {
    const host = new URL(url).hostname;
    if (host.includes("indeed.")) return "indeed";
    if (host.includes("glassdoor.")) return "glassdoor";
    if (host.includes("greenhouse.io") || host.includes("boards.greenhouse")) return "greenhouse";
    if (host.includes("lever.co")) return "lever";
    if (host.includes("myworkdayjobs.com") || host.includes("workday")) return "workday";
  } catch {
    /* ignore */
  }
  return "generic";
}

export const genericExtractor: JobExtractor = {
  platform: "generic",

  canHandle(): boolean {
    return true;
  },

  extract(doc: Document, url: string): RawJobData {
    const platform = detectPlatform(url);
    const ld = parseJsonLdJobs(doc);

    const title =
      ld?.title ||
      firstText(
        [
          'meta[property="og:title"]',
          "h1",
          '[itemprop="title"]',
          ".job-title",
          "#job-title",
        ],
        doc,
      ) ||
      doc.querySelector('meta[property="og:title"]')?.getAttribute("content") ||
      doc.title ||
      undefined;

    const company =
      companyFromLd(ld ?? {}) ||
      firstText(['[itemprop="hiringOrganization"]', ".company-name", ".employer", ".posting-company"], doc) ||
      undefined;

    const location =
      locationFromLd(ld ?? {}) ||
      firstText(['[itemprop="jobLocation"]', ".location", ".job-location"], doc) ||
      undefined;

    let description: string | undefined;
    if (ld?.description) {
      description = stripHtml(ld.description);
    }
    if (!description) {
      description =
        textOf(doc.querySelector('[itemprop="description"]')) ||
        textOf(doc.querySelector(".job-description")) ||
        textOf(doc.querySelector("#content")) ||
        textOf(doc.querySelector("article")) ||
        textOf(doc.querySelector("main")) ||
        doc.body.innerText.slice(0, 20000);
    }

    const employmentType = Array.isArray(ld?.employmentType)
      ? ld?.employmentType.join(", ")
      : ld?.employmentType;

    return {
      title: typeof title === "string" ? title.replace(/\s+/g, " ").trim() : undefined,
      company,
      location,
      salary: salaryFromLd(ld ?? {}),
      employmentType,
      description: description?.slice(0, 50000),
      url,
      platform,
    };
  },
};
