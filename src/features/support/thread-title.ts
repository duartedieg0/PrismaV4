import { generateText } from "ai";
import type { ResolvedMastraModel } from "@/mastra/providers/provider-factory";

export async function generateThreadTitle(
  model: ResolvedMastraModel,
  userMessage: string,
  assistantResponse: string,
): Promise<string> {
  try {
    const { text } = await generateText({
      model,
      prompt: `Com base na seguinte conversa entre um professor e um assistente pedagógico, gere um título curto (máximo 60 caracteres) que resuma o tema principal. Retorne APENAS o título, sem aspas nem pontuação final.

Professor: ${userMessage.slice(0, 500)}

Assistente: ${assistantResponse.slice(0, 500)}`,
    });

    const title = text.trim().slice(0, 80);
    return title || fallbackTitle(userMessage);
  } catch {
    return fallbackTitle(userMessage);
  }
}

function fallbackTitle(userMessage: string): string {
  const clean = userMessage.replace(/\s+/g, " ").trim();
  if (clean.length <= 80) return clean;
  return clean.slice(0, 77) + "...";
}
