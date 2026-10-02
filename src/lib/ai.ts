import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export const AI_MODEL = "gemini-3.5-flash";

/**
 * Calls Gemini and expects a JSON-only response. Gemini supports a native
 * JSON response mode, so this is more reliable than markdown-fence-stripping
 * — but we still strip/retry once as a safety net (Section 09.1 guidance).
 */
export async function askAIForJSON<T>(
  system: string,
  userPrompt: string,
  schema?: object
): Promise<T> {
  const attempt = async () => {
    const res = await ai.models.generateContent({
      model: AI_MODEL,
      contents: userPrompt,
      config: {
        systemInstruction: system,
        responseMimeType: "application/json",
        ...(schema ? { responseSchema: schema } : {}),
      },
    });
    const text = (res.text ?? "").trim();
    const cleaned = text
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/```$/i, "")
      .trim();
    return JSON.parse(cleaned) as T;
  };

  try {
    return await attempt();
  } catch (err) {
    // One retry, per the brief's fallback guidance.
    return await attempt();
  }
}

/** Plain-text Gemini call (used for report narratives, Ask LOOP answers). */
export async function askAIForText(
  system: string,
  userPrompt: string,
  maxOutputTokens = 1024
): Promise<string> {
  const res = await ai.models.generateContent({
    model: AI_MODEL,
    contents: userPrompt,
    config: {
      systemInstruction: system,
      maxOutputTokens,
    },
  });
  return (res.text ?? "").trim();
}