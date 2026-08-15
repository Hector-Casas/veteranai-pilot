export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { mistral } from "@ai-sdk/mistral";
import { convertToModelMessages, stepCountIs, streamText, UIMessage } from "ai";
import { CHATBOT_SYSTEM_PROMPT } from "@/lib/prompts/chatbot-system";
import { LANGUAGE_ENFORCEMENT_DIRECTIVE } from "@/lib/prompts/language-directive";
import { sendLeadEmailTool } from "@/lib/ai/tools/send-lead-email";
import { checkAvailabilityTool } from "@/lib/ai/tools/check-availability";
import { bookMeetingTool } from "@/lib/ai/tools/book-meeting";
import { checkRateLimit } from "@/lib/rate-limit";

export const maxDuration = 30;

export async function POST(req: Request) {
  const rateLimitResult = checkRateLimit(getClientIp(req));
  if (!rateLimitResult.allowed) {
    return new Response(
      JSON.stringify({ error: "Too many requests. Please try again later." }),
      { status: 429, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    const { messages }: { messages: UIMessage[] } = await req.json();

    // Inject current date/time so the model can resolve relative expressions
    // like "tomorrow", "next week", "Friday" without hallucinating dates.
    const now = new Date();
    const todayContext = `
CURRENT TIME CONTEXT (important, use it for all dates):
- Current date and time: ${now.toLocaleString("en-US", { timeZone: "America/New_York", dateStyle: "full", timeStyle: "short" })}
- Date in ISO format: ${now.toISOString()}
- Default time zone: America/New_York

When the user says "tomorrow", "next week", "Friday", etc., calculate dates based on this current date. NEVER invent dates. NEVER suggest a specific slot to the user that was not returned by the check_availability tool.
`;
    const fullSystemPrompt =
      CHATBOT_SYSTEM_PROMPT + "\n\n" + todayContext + "\n\n" + LANGUAGE_ENFORCEMENT_DIRECTIVE;

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
      JSON.stringify({ error: "We couldn't process your message. Please try again." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

function getClientIp(req: Request): string {
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}
