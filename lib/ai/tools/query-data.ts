import { tool } from "ai";
import { z } from "zod";
import { executeSQL } from "@/lib/executor/client";

const MAX_ROWS_TO_LLM = 100;

export const buildQueryDataTool = (datasetId: string) =>
  tool({
    description:
      "Executes a SQL SELECT query against the dataset. Returns columns and rows. " +
      "Only SELECT/WITH allowed. Use LIMIT to avoid overly large results.",
    inputSchema: z.object({
      sql: z
        .string()
        .min(10)
        .max(5000)
        .describe("Valid SQL SELECT. Must start with SELECT or WITH. DDL/DML forbidden."),
      purpose: z
        .string()
        .min(5)
        .max(200)
        .describe("One line describing what this query looks for (shown to the user)."),
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
