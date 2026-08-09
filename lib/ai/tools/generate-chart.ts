import { tool } from "ai";
import { z } from "zod";
import { executePython } from "@/lib/executor/client";

export const buildGenerateChartTool = (datasetId: string) =>
  tool({
    description:
      "Executes Python code with pandas/matplotlib/seaborn to generate analysis and charts. " +
      "Available variables: dfs (dict of DataFrames per table), conn (read-only SQLite), plt, pd, np, sns. " +
      "Assign result (dict/DataFrame/str) and/or summary (str) to return data. " +
      "Matplotlib figures are automatically captured as PNG images.",
    inputSchema: z.object({
      code: z
        .string()
        .min(20)
        .max(10000)
        .describe("Complete, self-contained Python code."),
      purpose: z
        .string()
        .min(5)
        .max(200)
        .describe("One line describing what this analysis does (shown to the user)."),
    }),
    execute: async ({ code, purpose }) => {
      const res = await executePython(datasetId, code);
      if (!res.success) {
        return { success: false, error: res.error, code };
      }
      const { result, charts, summary } = res.result;
      return {
        success: true,
        code,
        purpose,
        result,
        charts, // base64 PNG strings
        summary,
      };
    },
  });
