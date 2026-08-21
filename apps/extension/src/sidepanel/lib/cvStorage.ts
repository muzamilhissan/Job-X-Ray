const CV_KEY = "jobXrayCv";

export interface StoredCv {
  filename: string;
  text: string;
  uploadedAt: string;
  pages: number;
}

export async function loadCv(): Promise<StoredCv | null> {
  const result = await chrome.storage.local.get(CV_KEY);
  return (result[CV_KEY] as StoredCv | undefined) ?? null;
}

export async function saveCv(cv: StoredCv): Promise<void> {
  await chrome.storage.local.set({ [CV_KEY]: cv });
}

export async function clearCv(): Promise<void> {
  await chrome.storage.local.remove(CV_KEY);
}
