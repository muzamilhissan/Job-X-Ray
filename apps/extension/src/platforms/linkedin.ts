import type { RawJobData } from "@job-xray/shared-types";
import { type JobExtractor, firstText, textOf } from "./types";

function isLinkedInJobUrl(url: string): boolean {
  try {
    const u = new URL(url);
    if (!u.hostname.includes("linkedin.com")) return false;
    return (
      u.pathname.includes("/jobs/view/") ||
      u.pathname.includes("/jobs/collections/") ||
      u.searchParams.has("currentJobId") ||
      Boolean(document.querySelector(".jobs-details, .job-view-layout, .jobs-description"))
    );
  } catch {
    return false;
  }
}

function expandSeeMore(root: ParentNode): void {
  root.querySelectorAll("button").forEach((btn) => {
    const label = (btn.textContent ?? "").toLowerCase();
    if (label.includes("see more") || label.includes("show more")) {
      try {
        (btn as HTMLButtonElement).click();
      } catch {
        /* ignore */
      }
    }
  });
}

export const linkedInExtractor: JobExtractor = {
  platform: "linkedin",

  canHandle(url: string, doc: Document): boolean {
    return isLinkedInJobUrl(url) || Boolean(doc.querySelector(".jobs-description, .job-details-jobs-unified-top-card"));
  },

  extract(doc: Document, url: string): RawJobData {
    expandSeeMore(doc);

    const title =
      firstText(
        [
          ".job-details-jobs-unified-top-card__job-title h1",
          ".job-details-jobs-unified-top-card__job-title",
          "h1.t-24",
          ".jobs-unified-top-card__job-title",
          "h1",
        ],
        doc,
      ) ?? undefined;

    const company =
      firstText(
        [
          ".job-details-jobs-unified-top-card__company-name a",
          ".job-details-jobs-unified-top-card__company-name",
          ".jobs-unified-top-card__company-name a",
          ".jobs-unified-top-card__company-name",
        ],
        doc,
      ) ?? undefined;

    const location =
      firstText(
        [
          ".job-details-jobs-unified-top-card__tertiary-description-container",
          ".jobs-unified-top-card__bullet",
          ".jobs-unified-top-card__primary-description",
        ],
        doc,
      ) ?? undefined;

    const descriptionEl =
      doc.querySelector("#job-details") ||
      doc.querySelector(".jobs-description__content") ||
      doc.querySelector(".jobs-box__html-content") ||
      doc.querySelector(".jobs-description") ||
      doc.querySelector(".jobs-description-content");

    let description = textOf(descriptionEl);
    if (!description) {
      description = firstText(["article", "main"], doc);
    }

    const salary =
      firstText(
        [
          ".job-details-jobs-unified-top-card__job-insight--highlight",
          ".salary-main-rail__data-amount",
        ],
        doc,
      ) ?? undefined;

    return {
      title,
      company,
      location,
      salary,
      description: description?.slice(0, 50000),
      url,
      platform: "linkedin",
    };
  },
};
