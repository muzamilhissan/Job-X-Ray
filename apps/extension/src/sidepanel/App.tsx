import { useEffect, useState } from "react";
import type { HealthResponse, JobAnalysis, RawJobData } from "@job-xray/shared-types";
import { analyzeJob, checkHealth, draftCoverLetter, getApiBase, parseCvPdf, setApiBase } from "./lib/api";
import { loadCv, saveCv, clearCv, type StoredCv } from "./lib/cvStorage";
import { AnalysisView } from "./components/AnalysisView";
import { ModelDropdown, type ModelId } from "./components/ModelDropdown";
import "./App.css";

type Status = "idle" | "working" | "error";

const MODEL_OPTIONS: { id: ModelId; label: string; hint?: string }[] = [
  { id: "gemini", label: "Gemini", hint: "Google · free tier" },
];

const MODEL_KEY = "jobXrayModel";

export function App() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [cv, setCv] = useState<StoredCv | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<JobAnalysis | null>(null);
  const [lastJob, setLastJob] = useState<RawJobData | null>(null);
  const [model, setModel] = useState<ModelId>("gemini");
  const [coverLetter, setCoverLetter] = useState<string | null>(null);
  const [coverStatus, setCoverStatus] = useState<Status>("idle");
  const [coverMessage, setCoverMessage] = useState<string | null>(null);
  const [apiBase, setApiBaseField] = useState("http://localhost:8787");

  async function pingHealth() {
    try {
      setHealth(await checkHealth());
    } catch {
      setHealth({
        ok: false,
        ai: { provider: "unknown", configured: false },
      });
    }
  }

  useEffect(() => {
    void loadCv().then(setCv);
    void chrome.storage.local.get(MODEL_KEY).then((res) => {
      const saved = res[MODEL_KEY] as ModelId | undefined;
      if (saved && MODEL_OPTIONS.some((o) => o.id === saved)) setModel(saved);
    });
    void getApiBase().then(setApiBaseField);
    void pingHealth();
  }, []);

  async function onSaveApiBase() {
    await setApiBase(apiBase);
    await pingHealth();
  }

  async function onModelChange(next: ModelId) {
    setModel(next);
    await chrome.storage.local.set({ [MODEL_KEY]: next });
  }

  async function onUploadCv(file: File | null) {
    if (!file) return;
    setStatus("working");
    setMessage("Reading your CV…");
    try {
      const parsed = await parseCvPdf(file);
      const stored: StoredCv = {
        filename: parsed.meta.filename,
        text: parsed.text,
        uploadedAt: new Date().toISOString(),
        pages: parsed.meta.pages,
      };
      await saveCv(stored);
      setCv(stored);
      setMessage("CV ready");
      setStatus("idle");
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "Couldn’t read that PDF");
    }
  }

  async function onClearCv() {
    await clearCv();
    setCv(null);
    setMessage(null);
  }

  async function extractFromActiveTab(): Promise<RawJobData> {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) throw new Error("No active tab");
    if (!tab.url || tab.url.startsWith("chrome://") || tab.url.startsWith("chrome-extension://")) {
      throw new Error("Open a job posting first.");
    }

    try {
      const res = (await chrome.tabs.sendMessage(tab.id, { type: "EXTRACT_JOB" })) as {
        ok?: boolean;
        job?: RawJobData;
        error?: string;
        title?: string;
        description?: string;
        url?: string;
        platform?: string;
      };

      if (res?.job) return res.job;
      if (res?.ok === false) throw new Error(res.error ?? "Couldn’t read this page");
      if (res?.url || res?.description || res?.title) {
        return res as RawJobData;
      }
      throw new Error("Open the full job description, then try again.");
    } catch (err) {
      if (err instanceof Error && err.message.includes("Could not establish connection")) {
        throw new Error("Refresh the job page, then try again.");
      }
      throw err;
    }
  }

  async function onAnalyze() {
    setStatus("working");
    setMessage("Reading the job…");
    setAnalysis(null);
    setCoverLetter(null);
    setCoverMessage(null);
    setCoverStatus("idle");
    try {
      const job = await extractFromActiveTab();
      if (!job.description && !job.title) {
        throw new Error("Open the full job description, then try again.");
      }

      setLastJob(job);
      setMessage(cv ? "Scoring your fit…" : "Summarizing the role…");

      const result = await analyzeJob({
        job,
        cvText: cv?.text,
      });
      setAnalysis(result.analysis);
      setMessage(null);
      setStatus("idle");
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  async function onDraftCoverLetter() {
    if (!lastJob || !analysis) return;
    if (!cv?.text?.trim()) {
      setCoverStatus("error");
      setCoverMessage("Upload your CV first.");
      return;
    }

    setCoverStatus("working");
    setCoverMessage("Drafting a short letter…");
    try {
      const result = await draftCoverLetter({
        job: lastJob,
        cvText: cv.text,
        matchScore: analysis.matchScore,
        strongMatches: analysis.strongMatches,
        skillGaps: analysis.skillGaps,
      });
      setCoverLetter(result.letter);
      setCoverMessage(null);
      setCoverStatus("idle");
    } catch (err) {
      setCoverStatus("error");
      setCoverMessage(err instanceof Error ? err.message : "Couldn’t draft the letter");
    }
  }

  const serviceOk = health?.ok === true && health?.ai.configured === true;

  return (
    <div className="app">
      <header className="header">
        <div className="brand-row">
          <img
            className="brand-mark"
            src={chrome.runtime.getURL("icons/logo-mark.png")}
            alt=""
            width={36}
            height={36}
          />
          <div className="brand">Job X-Ray</div>
        </div>
        <p className="tagline">See how you fit before you apply.</p>
      </header>

      <div className="stack">
        <div>
          <ModelDropdown
            value={model}
            options={MODEL_OPTIONS}
            onChange={(id) => void onModelChange(id)}
          />
          <div className="api-field">
            <div className="field-label">API URL</div>
            <div className="api-row">
              <input
                className="api-input"
                type="url"
                value={apiBase}
                placeholder="https://job-xray-api.onrender.com"
                onChange={(e) => setApiBaseField(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") void onSaveApiBase();
                }}
              />
              <button type="button" className="btn" onClick={() => void onSaveApiBase()}>
                Save
              </button>
            </div>
            {!serviceOk && health !== null && (
              <p className="service-error" style={{ marginTop: 8 }}>
                Can’t reach the API. After Render finishes deploying, paste{" "}
                <code>https://your-service.onrender.com</code> and Save.
              </p>
            )}
          </div>
        </div>

        <div className={`cv-box ${cv ? "has-file" : ""}`}>
          <div className="field-label">Your CV</div>
          {cv ? (
            <div className="cv-row">
              <div>
                <div className="cv-name">{cv.filename}</div>
                <div className="cv-meta">
                  {cv.pages} page{cv.pages === 1 ? "" : "s"}
                </div>
              </div>
              <button type="button" className="btn ghost" onClick={() => void onClearCv()}>
                Remove
              </button>
            </div>
          ) : (
            <p className="cv-hint">Add a PDF once. We’ll use it to score every job.</p>
          )}
          <label className="btn file">
            {cv ? "Replace PDF" : "Upload PDF"}
            <input
              type="file"
              accept="application/pdf"
              hidden
              onChange={(e) => void onUploadCv(e.target.files?.[0] ?? null)}
            />
          </label>
        </div>

        <hr className="divider" />

        <div>
          <button
            type="button"
            className="btn primary"
            disabled={status === "working" || !serviceOk}
            onClick={() => void onAnalyze()}
          >
            {status === "working" ? "Working…" : "X-Ray this job"}
          </button>
          {message && (
            <p className={`status-line ${status === "error" ? "error" : ""}`}>{message}</p>
          )}
        </div>
      </div>

      {analysis && (
        <AnalysisView
          analysis={analysis}
          jobTitle={lastJob?.title}
          company={lastJob?.company}
          hasCv={Boolean(cv?.text?.trim())}
          coverLetter={coverLetter}
          coverStatus={coverStatus}
          coverMessage={coverMessage}
          onDraftCoverLetter={() => void onDraftCoverLetter()}
        />
      )}
    </div>
  );
}
