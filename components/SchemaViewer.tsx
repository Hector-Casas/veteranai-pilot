"use client";

import { ChevronDown } from "lucide-react";
import { useState } from "react";
import type { TableSchema } from "@/lib/datasets/types";

type Props = {
  tables: TableSchema[];
  accentColor?: string;
};

export default function SchemaViewer({ tables, accentColor = "var(--accent)" }: Props) {
  // First table is open by default
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggle = (i: number) => setOpenIndex((prev) => (prev === i ? null : i));

  return (
    <div className="space-y-2">
      {tables.map((table, i) => {
        const isOpen = openIndex === i;
        return (
          <div
            key={table.name}
            className="overflow-hidden rounded-xl"
            style={{ border: "1px solid var(--border)" }}
          >
            {/* Header */}
            <button
              className="flex w-full items-center justify-between px-5 py-4 text-left transition-colors hover:bg-white/[0.03]"
              onClick={() => toggle(i)}
              aria-expanded={isOpen}
            >
              <div className="flex items-center gap-3">
                {/* Table name in monospace */}
                <span
                  className="font-mono text-sm font-semibold"
                  style={{ color: accentColor }}
                >
                  {table.name}
                </span>
                <span className="text-xs" style={{ color: "var(--muted)" }}>
                  {table.description}
                </span>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <span
                  className="rounded-full px-2 py-0.5 text-xs font-medium tabular-nums"
                  style={{ backgroundColor: "var(--surface-hover)", color: "var(--muted)" }}
                >
                  ~{table.rowCount.toLocaleString("es-MX")} filas
                </span>
                <ChevronDown
                  size={15}
                  style={{
                    color: "var(--muted)",
                    transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                    transition: "transform 0.2s ease",
                  }}
                />
              </div>
            </button>

            {/* Body */}
            {isOpen && (
              <div style={{ borderTop: "1px solid var(--border)" }}>
                <table className="w-full text-xs">
                  <thead>
                    <tr style={{ backgroundColor: "var(--surface-hover)" }}>
                      {["Columna", "Tipo", "Descripción", "Ejemplo"].map((h) => (
                        <th
                          key={h}
                          className="px-5 py-2.5 text-left font-semibold uppercase tracking-wider"
                          style={{ color: "var(--muted)", fontSize: "10px" }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {table.columns.map((col, ci) => (
                      <tr
                        key={col.name}
                        style={{
                          borderTop: "1px solid var(--border)",
                          backgroundColor: ci % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)",
                        }}
                      >
                        {/* Column name — monospace */}
                        <td className="px-5 py-3">
                          <span className="font-mono font-medium text-foreground">
                            {col.name}
                          </span>
                        </td>
                        {/* Type — colored */}
                        <td className="px-5 py-3">
                          <span
                            className="rounded px-1.5 py-0.5 font-mono text-[11px] font-medium"
                            style={{
                              backgroundColor: `${accentColor}14`,
                              color: accentColor,
                            }}
                          >
                            {col.type}
                          </span>
                        </td>
                        {/* Description */}
                        <td className="px-5 py-3 leading-relaxed" style={{ color: "var(--muted)" }}>
                          {col.description}
                        </td>
                        {/* Example — muted monospace */}
                        <td className="px-5 py-3">
                          {col.example ? (
                            <span
                              className="font-mono text-[11px]"
                              style={{ color: "var(--muted)" }}
                            >
                              {col.example}
                            </span>
                          ) : (
                            <span style={{ color: "var(--border)" }}>—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
