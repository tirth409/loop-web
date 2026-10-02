import { db } from "@/lib/db";

const STOPWORDS = new Set([
  "the", "and", "for", "are", "but", "not", "you", "all", "any", "can", "had",
  "her", "was", "one", "our", "out", "has", "have", "with", "this", "that",
  "what", "when", "where", "which", "who", "why", "how", "about", "from",
  "they", "them", "their", "there", "these", "those", "been", "being", "does",
  "did", "say", "says", "saying", "are", "users", "user", "customers",
  "customer", "feedback", "people", "think", "want", "wants",
]);

function stem(word: string): string {
  return word.length > 4 ? word.replace(/(ing|ed|es|s)$/, "") : word;
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOPWORDS.has(w))
    .map(stem);
}

/**
 * Keyword retrieval with IDF weighting. Every query is scoped to the
 * caller's workspace (tenant isolation) and theme-name matches count double.
 */
export async function retrieveRelevantFeedback(
  workspaceId: string,
  question: string,
  k = 8
) {
  const queryTokens = Array.from(new Set(tokenize(question)));
  if (queryTokens.length === 0) return [];

  const corpus = await db.feedback.findMany({
    where: { workspaceId },
    include: { themes: { include: { theme: true } } },
    orderBy: { createdAt: "desc" },
    take: 500,
  });
  if (corpus.length === 0) return [];

  const docs = corpus.map((f) => ({
    feedback: f,
    contentTokens: new Set(tokenize(`${f.content} ${f.customerLabel ?? ""}`)),
    themeTokens: new Set(tokenize(f.themes.map((t) => t.theme.name).join(" "))),
  }));

  // Inverse document frequency: rarer words matter more.
  const idf = new Map<string, number>();
  for (const token of queryTokens) {
    const df = docs.filter(
      (d) => d.contentTokens.has(token) || d.themeTokens.has(token)
    ).length;
    idf.set(token, Math.log(1 + docs.length / (1 + df)));
  }

  return docs
    .map((d) => {
      let score = 0;
      for (const token of queryTokens) {
        const weight = idf.get(token) ?? 0;
        if (d.contentTokens.has(token)) score += weight;
        if (d.themeTokens.has(token)) score += weight * 2;
      }
      return { feedback: d.feedback, score };
    })
    .filter((d) => d.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, k)
    .map((d) => d.feedback);
}