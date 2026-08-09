/**
 * Urdu / RTL detection and language helpers.
 */
const URDU_RE = /[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]/;

/** Does the text contain Urdu/Arabic script characters? */
export function isUrduText(text: string): boolean {
  return URDU_RE.test(text);
}

export type Language = "en" | "ur" | "auto";

/**
 * Given the user's language preference and actual input text,
 * determine the effective language for transcription / display.
 */
export function effectiveLanguage(preference: Language, input: string): "en" | "ur" {
  if (preference === "ur") return "ur";
  if (preference === "auto") return isUrduText(input) ? "ur" : "en";
  return "en";
}

/** Short labels for the toggle */
export const LANGUAGE_LABELS: Record<Language, string> = {
  en: "English",
  ur: "اردو",
  auto: "EN/UR",
};