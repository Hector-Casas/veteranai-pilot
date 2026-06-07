import { getDataset } from "./schemas";
import type { DatasetId } from "./types";

/**
 * Converts a DatasetSchema into a compact, LLM-readable schema string.
 * Reuses metadata from schemas.ts — no duplication.
 */
export function buildSchemaPrompt(datasetId: string): string {
  const dataset = getDataset(datasetId as DatasetId);
  if (!dataset) return `Dataset desconocido: ${datasetId}`;

  const lines: string[] = [
    `DATASET: ${dataset.name}`,
    dataset.description,
    "",
  ];

  for (const table of dataset.tables) {
    lines.push(`Tabla: ${table.name} (~${table.rowCount.toLocaleString("es-MX")} filas)`);
    lines.push(`  ${table.description}`);
    for (const col of table.columns) {
      const example = col.example ? ` — ej. ${col.example}` : "";
      lines.push(`  - ${col.name} (${col.type}): ${col.description}${example}`);
    }
    lines.push("");
  }

  return lines.join("\n").trimEnd();
}
