import { z } from "zod";
import { db } from "@/lib/db";
import { askAIForJSON } from "@/lib/ai";

const classificationSchema = z.object({
  sentiment: z.enum(["POSITIVE", "NEUTRAL", "NEGATIVE"]),
  sentimentScore: z.number().min(-1).max(1),
  themes: z.array(z.string()).min(1).max(3),
  featureArea: z.string(),
  rationale: z.string(),
});
const geminiClassificationSchema = {
  type: "OBJECT",
  properties: {
    sentiment: { type: "STRING", enum: ["POSITIVE", "NEUTRAL", "NEGATIVE"] },
    sentimentScore: { type: "NUMBER" },
    themes: { type: "ARRAY", items: { type: "STRING" }, minItems: 1, maxItems: 3 },
    featureArea: { type: "STRING" },
    rationale: { type: "STRING" },
  },
  required: ["sentiment", "sentimentScore", "themes", "featureArea", "rationale"],
};

type Classification = z.infer<typeof classificationSchema>;

/**
 * AI1 — Auto-classification (Section 08 / 09.1). Sends one feedback item to
 * Claude along with the workspace's existing theme names so it reuses themes
 * instead of inventing near-duplicates, validates the structured response,
 * then persists sentiment + theme links.
 */
export async function classifyAndSaveFeedback(feedbackId: string, workspaceId: string) {
  const feedback = await db.feedback.findFirst({ where: { id: feedbackId, workspaceId } });
  if (!feedback) return;

  const existingThemes = await db.theme.findMany({
    where: { workspaceId },
    select: { name: true },
  });
  const themeNames = existingThemes.map((t) => t.name);

  const system = `You are LOOP's feedback classification engine. You will be given one piece of customer feedback and a list of existing theme names. Return ONLY a JSON object, no markdown fences, no extra commentary, with exactly this shape:
{
  "sentiment": "POSITIVE" | "NEUTRAL" | "NEGATIVE",
  "sentimentScore": number between -1 and 1,
  "themes": array of 1-3 short theme names — reuse an existing theme name whenever the feedback fits one; only invent a new short theme name (2-4 words) if nothing existing fits,
  "featureArea": one short phrase naming the product area this is about,
  "rationale": one sentence explaining the classification
}`;

  const userPrompt = `Existing themes: ${themeNames.length ? themeNames.join(", ") : "(none yet)"}

Feedback to classify:
"""
${feedback.content}
"""`;

  let parsed: Classification;
  try {
    const raw = await askAIForJSON<unknown>(system, userPrompt, geminiClassificationSchema);
    parsed = classificationSchema.parse(raw);
  } catch (err) {
    console.error(`Classification failed for feedback ${feedbackId}`, err);
    return; // leave it as-is rather than crash the ingest flow
  }

  // Reuse an existing theme by case-insensitive name match, else create one.
  const themeRecords = await Promise.all(
    parsed.themes.map(async (name) => {
      const existing = await db.theme.findFirst({
        where: { workspaceId, name: { equals: name, mode: "insensitive" } },
      });
      if (existing) return existing;
      return db.theme.create({ data: { name, workspaceId } });
    })
  );

  await db.$transaction([
    db.feedback.update({
      where: { id: feedbackId },
      data: { sentiment: parsed.sentiment, sentimentScore: parsed.sentimentScore },
    }),
    db.feedbackTheme.deleteMany({ where: { feedbackId } }),
    ...themeRecords.map((theme) =>
      db.feedbackTheme.create({
        data: { feedbackId, themeId: theme.id, confidence: 0.85 },
      })
    ),
  ]);
}