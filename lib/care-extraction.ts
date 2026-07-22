const actionWords = ["take", "give", "book", "call", "monitor", "check", "change", "schedule", "follow up", "refill"];
const riskWords = ["fever", "fall", "dizzy", "confusion", "bleeding", "pain", "swelling", "shortness", "emergency"];

export type CareExtraction = { summary: string; suggestedTasks: string[]; redFlags: string[]; source: "ai" | "rules" };

export function extractCareText(text: string): CareExtraction {
  const cleaned = text.replace(/\s+/g, " ").trim();
  const sentences = cleaned.split(/(?<=[.!?])\s+/).filter(Boolean);
  const summary = sentences.slice(0, 3).join(" ").slice(0, 700) || cleaned.slice(0, 700);
  const suggestedTasks = sentences
    .filter(sentence => actionWords.some(word => sentence.toLowerCase().includes(word)))
    .slice(0, 8);
  const redFlags = sentences
    .filter(sentence => riskWords.some(word => sentence.toLowerCase().includes(word)))
    .slice(0, 6);

  return { summary, suggestedTasks, redFlags, source: "rules" };
}

function cleanList(value: unknown, max: number) {
  return Array.isArray(value) ? value.filter(item => typeof item === "string").map(item => item.trim()).filter(Boolean).slice(0, max) : [];
}

/** Uses Gemini only on the server; rules remain available when no key is configured. */
export async function extractCareTextWithAi(text: string): Promise<CareExtraction> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return extractCareText(text);

  try {
    const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: `You are helping a family coordinate home care. Extract only information present in the note. Return JSON with summary (plain concise string, maximum 700 characters), suggestedTasks (up to 8 strings), and redFlags (up to 6 strings). Do not diagnose, invent treatment, or provide medical advice. Care note:\n\n${text}` }] }],
        generationConfig: { responseMimeType: "application/json", temperature: 0.2 }
      }),
      cache: "no-store"
    });
    if (!response.ok) throw new Error(`Gemini returned ${response.status}`);
    const payload = await response.json();
    const raw = payload?.candidates?.[0]?.content?.parts?.[0]?.text;
    const parsed = typeof raw === "string" ? JSON.parse(raw) : null;
    if (!parsed || typeof parsed.summary !== "string") throw new Error("Gemini returned an invalid response");
    return { summary: parsed.summary.trim().slice(0, 700), suggestedTasks: cleanList(parsed.suggestedTasks, 8), redFlags: cleanList(parsed.redFlags, 6), source: "ai" };
  } catch (error) {
    console.error("Gemini extraction failed; using rules fallback", error);
    return extractCareText(text);
  }
}
