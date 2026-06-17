const actionWords = ["take", "give", "book", "call", "monitor", "check", "change", "schedule", "follow up", "refill"];
const riskWords = ["fever", "fall", "dizzy", "confusion", "bleeding", "pain", "swelling", "shortness", "emergency"];

export function extractCareText(text: string) {
  const cleaned = text.replace(/\s+/g, " ").trim();
  const sentences = cleaned.split(/(?<=[.!?])\s+/).filter(Boolean);
  const summary = sentences.slice(0, 3).join(" ").slice(0, 700) || cleaned.slice(0, 700);
  const suggestedTasks = sentences
    .filter(sentence => actionWords.some(word => sentence.toLowerCase().includes(word)))
    .slice(0, 8);
  const redFlags = sentences
    .filter(sentence => riskWords.some(word => sentence.toLowerCase().includes(word)))
    .slice(0, 6);

  return { summary, suggestedTasks, redFlags };
}
