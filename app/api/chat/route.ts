export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { mistral } from "@ai-sdk/mistral";
import { convertToModelMessages, stepCountIs, streamText, UIMessage } from "ai";
import { CHATBOT_SYSTEM_PROMPT } from "@/lib/prompts/chatbot-system";
import { sendLeadEmailTool } from "@/lib/ai/tools/send-lead-email";
import { checkAvailabilityTool } from "@/lib/ai/tools/check-availability";
import { bookMeetingTool } from "@/lib/ai/tools/book-meeting";

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { messages }: { messages: UIMessage[] } = await req.json();

    // Inject current date/time so the model can resolve relative expressions
    // like "mañana", "la próxima semana", "el viernes" without hallucinating dates.
    const now = new Date();
    const todayContext = `
CONTEXTO TEMPORAL ACTUAL (importante, úsalo para todas las fechas):
- Fecha y hora actual: ${now.toLocaleString("es-MX", { timeZone: "America/Mexico_City", dateStyle: "full", timeStyle: "short" })}
- Fecha en formato ISO: ${now.toISOString()}
- Zona horaria por defecto: America/Mexico_City

Cuando el usuario diga "mañana", "la próxima semana", "el viernes", etc., calcula las fechas en base a esta fecha actual. NUNCA inventes fechas. NUNCA sugieras un slot específico al usuario que no haya sido devuelto por el tool check_availability.
`;
    const fullSystemPrompt = CHATBOT_SYSTEM_PROMPT + "\n\n" + todayContext;

    const result = streamText({
      model: mistral("mistral-large-2512"),
      system: fullSystemPrompt,
      messages: await convertToModelMessages(messages),
      tools: {
        send_lead_email: sendLeadEmailTool,
        check_availability: checkAvailabilityTool,
        book_meeting: bookMeetingTool,
      },
      // Allow multi-tool flows: check_availability → present slots → book_meeting → follow-up
      stopWhen: stepCountIs(8),
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error("[/api/chat] Error:", error);
    return new Response(
      JSON.stringify({ error: "No se pudo procesar tu mensaje. Intenta de nuevo." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
