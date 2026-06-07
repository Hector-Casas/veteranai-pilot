"use client";

import { useState } from "react";

type Props = {
  columns: string[];
  rows: unknown[][];
  rowCount: number;
  truncated?: boolean;
};

const MAX_DISPLAY = 50;

function isNumeric(val: unknown): boolean {
  return typeof val === "number" || (typeof val === "string" && val !== "" && !isNaN(Number(val)));
}

function isDateLike(val: unknown): boolean {
  if (typeof val !== "string") return false;
  return /^\d{4}-\d{2}-\d{2}/.test(val);
}

function formatCell(val: unknown): string {
  if (val == null) return "—";
  if (isDateLike(val)) {
    // Format ISO date/datetime to readable form
    try {
      const d = new Date(val as string);
      if (isNaN(d.getTime())) return String(val);
      return d.toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" });
    } catch {
      return String(val);
    }
  }
  if (typeof val === "number") {
    return Number.isInteger(val)
      ? val.toLocaleString("es-MX")
      : val.toLocaleString("es-MX", { maximumFractionDigits: 2 });
  }
  return String(val);
}

export default function DataTable({ columns, rows, rowCount, truncated }: Props) {
  const [showAll, setShowAll] = useState(false);
  const displayedRows = showAll ? rows : rows.slice(0, MAX_DISPLAY);
  const hasMore = rows.length > MAX_DISPLAY;

  // Detect numeric columns from first row
  const firstRow = rows[0] ?? [];
  const numericCols = new Set(
    columns.map((_, i) => i).filter((i) => isNumeric(firstRow[i]))
  );

  return (
    <div className="w-full">
      <div
        className="overflow-x-auto rounded-xl"
        style={{ border: "1px solid var(--border)" }}
      >
        <table className="w-full text-xs">
          {/* Header */}
          <thead>
            <tr style={{ backgroundColor: "var(--surface-hover)" }}>
              {columns.map((col) => (
                <th
                  key={col}
                  className="px-4 py-2.5 text-left font-semibold uppercase tracking-wider whitespace-nowrap"
                  style={{ color: "var(--muted)", fontSize: "10px", borderBottom: "1px solid var(--border)" }}
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          {/* Body */}
          <tbody>
            {displayedRows.map((row, ri) => (
              <tr
                key={ri}
                style={{
                  borderTop: ri > 0 ? "1px solid var(--border)" : undefined,
                  backgroundColor: ri % 2 === 1 ? "rgba(255,255,255,0.02)" : "transparent",
                }}
              >
                {row.map((cell, ci) => (
                  <td
                    key={ci}
                    className="px-4 py-2 whitespace-nowrap"
                    style={{
                      color: cell == null ? "var(--muted)" : "var(--foreground)",
                      textAlign: numericCols.has(ci) ? "right" : "left",
                      fontFamily: numericCols.has(ci) ? "var(--font-mono, monospace)" : undefined,
                    }}
                  >
                    {formatCell(cell)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="mt-2 flex items-center justify-between text-xs" style={{ color: "var(--muted)" }}>
        <span>
          {hasMore && !showAll
            ? `Mostrando ${MAX_DISPLAY} de ${rowCount.toLocaleString("es-MX")} filas`
            : `${rowCount.toLocaleString("es-MX")} filas`}
          {(truncated) && " · resultado truncado"}
        </span>
        {hasMore && (
          <button
            onClick={() => setShowAll((v) => !v)}
            className="underline transition-opacity hover:opacity-70"
            style={{ color: "var(--accent)" }}
          >
            {showAll ? "Mostrar menos" : `Ver todas (${rowCount.toLocaleString("es-MX")})`}
          </button>
        )}
      </div>
    </div>
  );
}
