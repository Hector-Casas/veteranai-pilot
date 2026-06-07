import { tool } from "ai";
import { z } from "zod";
import { executeSQL } from "@/lib/executor/client";

const MAX_ROWS_TO_LLM = 100;

export const buildQueryDataTool = (datasetId: string) =>
  tool({
    description:
      "Ejecuta una query SQL SELECT contra el dataset. Devuelve columnas y filas. " +
      "Solo SELECT/WITH permitido. Usa LIMIT para evitar resultados demasiado grandes.",
    inputSchema: z.object({
      sql: z
        .string()
        .min(10)
        .max(5000)
        .describe("SQL SELECT válido. Debe empezar con SELECT o WITH. Prohibido DDL/DML."),
      purpose: z
        .string()
        .min(5)
        .max(200)
        .describe("Una línea describiendo qué busca esta query (se muestra al usuario)."),
    }),
    execute: async ({ sql, purpose }) => {
      const res = await executeSQL(datasetId, sql);
      if (!res.success) {
        return { success: false, error: res.error, sql };
      }
      const { columns, rows, rowCount, truncated } = res.result;
      const cappedRows = rows.slice(0, MAX_ROWS_TO_LLM);
      return {
        success: true,
        sql,
        purpose,
        columns,
        rows: cappedRows,
        rowCount,
        truncated: truncated || rows.length > MAX_ROWS_TO_LLM,
      };
    },
  });
