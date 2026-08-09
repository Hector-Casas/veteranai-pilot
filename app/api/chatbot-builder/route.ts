export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { mistral } from "@ai-sdk/mistral";
import { convertToModelMessages, streamText, UIMessage } from "ai";
import { CATALOG, IndustryKey, buildGeneratedChatbotPrompt } from "@/lib/prompts/chatbot-builder";
import { LANGUAGE_ENFORCEMENT_DIRECTIVE } from "@/lib/prompts/language-directive";
import { checkRateLimit } from "@/lib/rate-limit";

export const maxDuration = 30;

function isIndustryKey(value: unknown): value is IndustryKey {
  return typeof value === "string" && value in CATALOG;
}

type RequestBody = {
  industryKey?: string;
  capabilities?: string[];
  messages?: UIMessage[];
};

export async function POST(req: Request) {
  const rateLimitResult = checkRateLimit(getClientIp(req));
  if (!rateLimitResult.allowed) {
    return new Response(
      JSON.stringify({ error: "Too many requests. Please try again later." }),
      { status: 429, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    const { industryKey, capabilities, messages }: RequestBody = await req.json();

    // Never trust the client: industryKey and each capability must match
    // the catalog exactly, or the request is rejected before it ever
    // reaches the model.
    if (!isIndustryKey(industryKey)) {
      return new Response(
        JSON.stringify({ error: `Invalid industryKey: "${industryKey}"` }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!Array.isArray(capabilities) || capabilities.length === 0) {
      return new Response(
        JSON.stringify({ error: "capabilities must be a non-empty array" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const allowedCapabilities = CATALOG[industryKey].capabilities;
    const invalidCapabilities = capabilities.filter((c) => !allowedCapabilities.includes(c));
    if (invalidCapabilities.length > 0) {
      return new Response(
        JSON.stringify({
          error: `Invalid capabilities for industry "${industryKey}": ${invalidCapabilities.join(", ")}`,
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!messages) {
      return new Response(
        JSON.stringify({ error: "messages is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const systemPrompt =
      buildGeneratedChatbotPrompt(industryKey, capabilities) + "\n\n" + LANGUAGE_ENFORCEMENT_DIRECTIVE;

    // Zero tools by design — the generated bot only converses in character,
    // it never calls a real Cal.com/Resend/executor integration.
    const result = streamText({
      model: mistral("mistral-large-2512"),
      system: systemPrompt,
      messages: await convertToModelMessages(messages),
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error("[/api/chatbot-builder] Error:", error);
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
