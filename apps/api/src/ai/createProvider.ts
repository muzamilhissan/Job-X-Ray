import type { AIProvider } from "./AIProvider.js";
import { GeminiProvider } from "./GeminiProvider.js";
import { DemoProvider } from "./DemoProvider.js";

export function createAIProvider(): AIProvider {
  const provider = (process.env.AI_PROVIDER ?? "gemini").toLowerCase();

  if (provider === "demo") {
    return new DemoProvider();
  }

  return new GeminiProvider(process.env.GEMINI_API_KEY);
}
