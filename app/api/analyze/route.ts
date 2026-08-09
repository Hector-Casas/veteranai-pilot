export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { mistral } from "@ai-sdk/mistral";
import { convertToModelMessages, stepCountIs, streamText, UIMessage } from "ai";
import { buildAnalystSystemPrompt } from "@/lib/prompts/analyst-system";
import { LANGUAGE_ENFORCEMENT_DIRECTIVE } from "@/lib/prompts/language-directive";
import { buildQueryDataTool } from "@/lib/ai/tools/query-data";
import { buildGenerateChartTool } from "@/lib/ai/tools/generate-chart";

export const maxDuration = 60; // matplotlib sandbox can take a few seconds

const VALID_DATASETS = ["ventas-retail", "metricas-saas", "recursos-humanos"] as const;
type ValidDataset = (typeof VALID_DATASETS)[number];

export async function POST(req: Request) {
  try {
    const body = await req.json() as { messages: UIMessage[]; datasetId: string };
    const { messages, datasetId } = body;

    if (!datasetId || !VALID_DATASETS.includes(datasetId as ValidDataset)) {
      return new Response(
        JSON.stringify({ error: `Invalid datasetId: ${datasetId}` }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const result = streamText({
      model: mistral("mistral-large-2512"),
      system: buildAnalystSystemPrompt(datasetId) + "\n\n" + LANGUAGE_ENFORCEMENT_DIRECTIVE,
      messages: await convertToModelMessages(messages),
      tools: {
        query_data: buildQueryDataTool(datasetId),
        generate_chart: buildGenerateChartTool(datasetId),
      },
      stopWhen: stepCountIs(8),
      onStepFinish: ({ stepNumber, toolCalls, finishReason }) => {
        console.log("[/api/analyze] step:", {
          step: stepNumber,
          tools: toolCalls?.map((t) => t.toolName),
          finishReason,
        });
      },
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error("[/api/analyze] Error:", error);
    return new Response(
      JSON.stringify({ error: "We couldn't process the analysis request. Please try again." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
