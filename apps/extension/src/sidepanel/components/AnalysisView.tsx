import { useState } from "react";
import type { JobAnalysis, Recommendation } from "@job-xray/shared-types";

const REC_META: Record<Recommendation, { className: string }> = {
  APPLY: { className: "rec-apply" },
  MAYBE: { className: "rec-maybe" },
  SKIP: { className: "rec-skip" },
};

export function AnalysisView({
  analysis,
  jobTitle,
  company,
  hasCv,
  coverLetter,
  coverStatus,
  coverMessage,
  onDraftCoverLetter,
}: {
  analysis: JobAnalysis;
  jobTitle?: string;
  company?: string;
  hasCv: boolean;
  coverLetter: string | null;
  coverStatus: "idle" | "working" | "error";
  coverMessage: string | null;
  onDraftCoverLetter: () => void;
}) {
  const rec = REC_META[analysis.recommendation];
  const [copied, setCopied] = useState(false);

  async function onCopy() {
    if (!coverLetter) return;
    await navigator.clipboard.writeText(coverLetter);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <div className="results">
      <div className="results-head">
        <div className="job-title">{jobTitle ?? analysis.roleSummary}</div>
        {company && <div className="company">{company}</div>}
        {analysis.roleSummary && (
          <p className="role-summary">{analysis.roleSummary}</p>
        )}
      </div>

      <div className="score-panel">
        <div className="match-score-label">Match score</div>
        <div className="match-score-value">{Math.round(analysis.matchScore)}%</div>
        <div className="meter">
          <div
            className="meter-fill"
            style={{ width: `${Math.min(100, Math.max(0, analysis.matchScore))}%` }}
          />
        </div>
      </div>

      <section className="result-section">
        <h2>Strong matches</h2>
        {analysis.strongMatches.length === 0 ? (
          <p className="empty">None found</p>
        ) : (
          <ul className="check-list">
            {analysis.strongMatches.map((s) => (
              <li key={s}>
                <span className="mark ok" aria-hidden>
                  ✓
                </span>
                {s}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="result-section">
        <h2>Skill gaps</h2>
        {analysis.skillGaps.length === 0 ? (
          <p className="empty">None found</p>
        ) : (
          <ul className="check-list">
            {analysis.skillGaps.map((s) => (
              <li key={s}>
                <span className="mark warn" aria-hidden>
                  !
                </span>
                {s}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="result-section">
        <h2>Experience</h2>
        {!analysis.experienceGap ? (
          <p className="empty">Not enough detail to compare</p>
        ) : (
          <ul className="check-list">
            <li>
              <span className="mark warn" aria-hidden>
                !
              </span>
              Job asks {analysis.experienceGap.jobAsks}
            </li>
            <li>
              <span
                className={`mark ${analysis.experienceGap.met ? "ok" : "warn"}`}
                aria-hidden
              >
                {analysis.experienceGap.met ? "✓" : "!"}
              </span>
              You have {analysis.experienceGap.youHave}
            </li>
          </ul>
        )}
      </section>

      <div className={`rec-panel ${rec.className}`}>
        <h2>Recommendation</h2>
        <div className="rec-pill">
          <span className="rec-dot" aria-hidden />
          {analysis.recommendation}
        </div>
      </div>

      <section className="cover-section">
        <div className="cover-head">
          <h2>Cover letter</h2>
          <p className="cover-note">
            Optional. Only drafts when you ask, so it doesn’t spend tokens on every job.
          </p>
        </div>

        {!hasCv ? (
          <p className="empty">Upload your CV above to draft a letter for this role.</p>
        ) : (
          <>
            {!coverLetter && (
              <button
                type="button"
                className="btn secondary"
                disabled={coverStatus === "working"}
                onClick={onDraftCoverLetter}
              >
                {coverStatus === "working" ? "Drafting…" : "Draft cover letter"}
              </button>
            )}

            {coverMessage && (
              <p className={`status-line ${coverStatus === "error" ? "error" : ""}`}>
                {coverMessage}
              </p>
            )}

            {coverLetter && (
              <div className="cover-letter-box">
                <pre className="cover-letter-text">{coverLetter}</pre>
                <div className="cover-actions">
                  <button type="button" className="btn ghost" onClick={() => void onCopy()}>
                    {copied ? "Copied" : "Copy"}
                  </button>
                  <button
                    type="button"
                    className="btn secondary"
                    disabled={coverStatus === "working"}
                    onClick={onDraftCoverLetter}
                  >
                    {coverStatus === "working" ? "Drafting…" : "Draft again"}
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}
