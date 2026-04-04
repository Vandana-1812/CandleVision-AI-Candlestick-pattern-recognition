import { genkit } from "genkit";
import { googleAI } from "@genkit-ai/google-genai";

const LLM_FALLBACK_FLAG = 'CANDLEVISION_ENABLE_LLM_FALLBACK';

export const ai = genkit({
  plugins: [
    googleAI({
      apiKey: process.env.GOOGLE_API_KEY,
    }),
  ],

  model: "googleai/gemini-2.5-flash",
});

export function isLlmFallbackEnabled(): boolean {
  return process.env[LLM_FALLBACK_FLAG]?.toLowerCase() === 'true';
}

export function assertLlmFallbackEnabled(context: string): void {
  if (!isLlmFallbackEnabled()) {
    throw new Error(
      `${context} attempted to invoke Gemini while ${LLM_FALLBACK_FLAG} is disabled. ` +
        `Set ${LLM_FALLBACK_FLAG}=true only when you want API fallback behavior.`
    );
  }
}
