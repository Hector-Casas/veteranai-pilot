import { tool } from "ai";
import { z } from "zod";
import { executePython } from "@/lib/executor/client";

export const buildGenerateChartTool = (datasetId: string) =>
  tool({
    description:
      "Ejecuta código Python con pandas/matplotlib/seaborn para generar análisis y gráficas. " +
      "Variables disponibles: dfs (dict DataFrames por tabla), conn (SQLite RO), plt, pd, np, sns. " +
      "Asigna result (dict/DataFrame/str) y/o summary (str) para devolver datos. " +
      "Las figuras de matplotlib se capturan automáticamente como imágenes PNG.",
    inputSchema: z.object({
      code: z
        .string()
        .min(20)
        .max(10000)
        .describe("Código Python completo y autosuficiente."),
      purpose: z
        .string()
        .min(5)
        .max(200)
        .describe("Una línea describiendo qué hace este análisis (se muestra al usuario)."),
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
