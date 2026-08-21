import { extractJob } from "../platforms";

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  // After extension reload, orphaned scripts lose a valid runtime id
  if (!chrome.runtime?.id) {
    sendResponse({
      ok: false,
      error: "Extension was reloaded. Refresh this tab, then try again.",
    });
    return true;
  }

  if (message?.type === "EXTRACT_JOB") {
    try {
      const job = extractJob();
      sendResponse({ ok: true, job });
    } catch (err) {
      sendResponse({
        ok: false,
        error: err instanceof Error ? err.message : "Extraction failed",
      });
    }
    return true;
  }
  return false;
});
