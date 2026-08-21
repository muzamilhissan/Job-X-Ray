const DEFAULT_API_BASE =
  (import.meta.env.VITE_API_BASE as string | undefined)?.replace(/\/$/, "") ??
  "http://localhost:8787";

const API_BASE_KEY = "jobXrayApiBase";

export async function getApiBase(): Promise<string> {
  const res = await chrome.storage.local.get(API_BASE_KEY);
  const stored = (res[API_BASE_KEY] as string | undefined)?.trim().replace(/\/$/, "");
  return stored || DEFAULT_API_BASE;
}

export async function setApiBase(url: string): Promise<string> {
  const next = url.trim().replace(/\/$/, "");
  await chrome.storage.local.set({ [API_BASE_KEY]: next });
  return next;
}

async function apiUrl(path: string): Promise<string> {
  const base = await getApiBase();
  return `${base}${path}`;
}

export async function checkHealth() {
  const res = await fetch(await apiUrl("/health"));
  if (!res.ok) throw new Error(`Health check failed (${res.status})`);
  return res.json();
}

export async function parseCvPdf(file: File) {
  const form = new FormData();
  form.append("cv", file);
  const res = await fetch(await apiUrl("/api/cv/parse"), {
    method: "POST",
    body: form,
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error ?? `CV parse failed (${res.status})`);
  }
  return data as {
    success: true;
    text: string;
    meta: { pages: number; bytes: number; filename: string };
  };
}

export async function analyzeJob(body: {
  job: {
    title?: string;
    company?: string;
    location?: string;
    description?: string;
    url: string;
    platform: string;
  };
  cvText?: string;
}) {
  const res = await fetch(await apiUrl("/api/analyze-job"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    const errMsg =
      typeof data.error === "string" ? data.error : `Analyze failed (${res.status})`;
    throw new Error(errMsg);
  }
  return data as { success: true; analysis: import("@job-xray/shared-types").JobAnalysis };
}

export async function draftCoverLetter(body: {
  job: {
    title?: string;
    company?: string;
    location?: string;
    description?: string;
    url: string;
    platform: string;
  };
  cvText: string;
  matchScore?: number;
  strongMatches?: string[];
  skillGaps?: string[];
}) {
  const res = await fetch(await apiUrl("/api/cover-letter"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    const errMsg =
      typeof data.error === "string" ? data.error : `Cover letter failed (${res.status})`;
    throw new Error(errMsg);
  }
  return data as { success: true; letter: string };
}
