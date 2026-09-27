import type { SupabaseClient } from "@supabase/supabase-js";

export type ChatTurn = { role: "user" | "assistant"; content: string };

type Args = {
  supabase: SupabaseClient;
  userId: string;
  question: string;
  farmId: string | null;
  history: ChatTurn[];
};

export async function answerFarmQuestion({ supabase, userId, question, farmId, history }: Args) {
  let predictionsQuery = supabase
    .from("predictions")
    .select("moisture,label,confidence,moisture_category,created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(15);
  let detectionsQuery = supabase
    .from("detections")
    .select("label,confidence,disease_name,severity,green_ratio,brown_ratio,yellow_ratio,created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(15);

  if (farmId) {
    predictionsQuery = predictionsQuery.eq("farm_id", farmId);
    detectionsQuery = detectionsQuery.eq("farm_id", farmId);
  }

  const [{ data: predictions }, { data: detections }, { data: farms }] = await Promise.all([
    predictionsQuery,
    detectionsQuery,
    supabase.from("farms").select("id,name,location,moisture_threshold").eq("user_id", userId),
  ]);

  const context = JSON.stringify({ farms, predictions, detections }, null, 0).slice(0, 12000);

  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) {
    return { answer: "The AI assistant is not configured yet. Please try again later." };
  }

  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "google/gemini-3.5-flash",
      messages: [
        {
          role: "system",
          content:
            "You are AgriSense AI, an agronomy assistant. Answer only from the JSON farm data provided. " +
            "Be concise (max 120 words), practical, and quote concrete numbers and dates from the data. " +
            "If the data does not contain the answer, say so and suggest which scan the farmer should run.\n\n" +
            `FARM DATA:\n${context}`,
        },
        ...history.map((t) => ({ role: t.role, content: t.content })),
        { role: "user", content: question },
      ],
    }),
  });

  if (res.status === 429) return { answer: "Rate limit reached — please wait a moment and ask again." };
  if (res.status === 402) return { answer: "AI credits are exhausted. Please top up to keep using the assistant." };
  if (!res.ok) {
    console.error("AI gateway error", res.status, await res.text());
    return { answer: "The assistant could not answer right now. Please try again." };
  }

  const json = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
  return { answer: json.choices?.[0]?.message?.content ?? "No answer returned." };
}
