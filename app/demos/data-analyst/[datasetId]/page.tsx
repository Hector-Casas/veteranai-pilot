import { notFound } from "next/navigation";
import Link from "next/link";
import { BarChart3, LineChart, ShoppingCart, Users } from "lucide-react";
import type { Metadata } from "next";
import type { LucideIcon } from "lucide-react";
import SchemaViewer from "@/components/SchemaViewer";
import AnalystChatInterface from "@/components/AnalystChatInterface";
import { getDataset } from "@/lib/datasets/schemas";

const ICON_MAP: Record<string, LucideIcon> = {
  ShoppingCart,
  LineChart,
  BarChart3,
  Users,
};

type Params = { datasetId: string };

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { datasetId } = await params;
  const dataset = getDataset(datasetId);
  if (!dataset) return { title: "Dataset no encontrado — Veteran AI" };
  return {
    title: `${dataset.name} — AI Data Analyst — Veteran AI`,
    description: dataset.description,
  };
}

export default async function DatasetPage({ params }: { params: Promise<Params> }) {
  const { datasetId } = await params;
  const dataset = getDataset(datasetId);
  if (!dataset) notFound();

  const Icon = ICON_MAP[dataset.icon] ?? BarChart3;
  const accent = dataset.accentColor;
  const accentDim = `${accent}18`;

  return (
    <div className="flex flex-1 flex-col">
      {/* ── Breadcrumb header ── */}
      <header
        className="flex items-center gap-3 border-b px-6 py-4 text-sm"
        style={{ borderColor: "var(--border)" }}
      >
        <Link href="/demos" className="transition-opacity hover:opacity-70" style={{ color: "var(--muted)" }}>
          Demos
        </Link>
        <span style={{ color: "var(--border)" }}>/</span>
        <Link href="/demos/data-analyst" className="transition-opacity hover:opacity-70" style={{ color: "var(--muted)" }}>
          Data Analyst
        </Link>
        <span style={{ color: "var(--border)" }}>/</span>
        <span className="font-semibold text-foreground">{dataset.name}</span>

        <span
          className="ml-auto flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium"
          style={{ backgroundColor: "var(--accent-dim)", color: "var(--accent)" }}
        >
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current" />
          Live demo
        </span>
      </header>

      {/* ── Two-column layout ── */}
      <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-6 lg:flex-row lg:items-start">

        {/* ═══════════════ LEFT — schema reference (35%) ═══════════════ */}
        <aside className="flex flex-col gap-8 lg:w-[35%] lg:shrink-0">
          {/* Dataset hero */}
          <div>
            <div
              className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl"
              style={{ backgroundColor: accentDim, color: accent }}
            >
              <Icon size={22} strokeWidth={1.5} />
            </div>
            <h1 className="mb-2 text-2xl font-bold tracking-tight text-foreground">
              {dataset.name}
            </h1>
            <p className="mb-4 text-sm leading-relaxed" style={{ color: "var(--muted)" }}>
              {dataset.description}
            </p>
            <div className="flex flex-wrap gap-2">
              {dataset.badges.map((b, i) => (
                  <span
                    key={`${i}-${b}`}
                    className="rounded-full px-2.5 py-1 text-xs font-medium"
                    style={{ backgroundColor: accentDim, color: accent }}
                  >
                    {b}
                  </span>
                )
              )}
            </div>
          </div>

          {/* Schema viewer */}
          <div>
            <h2 className="mb-3 text-sm font-semibold text-foreground">Esquema de tablas</h2>
            <SchemaViewer tables={dataset.tables} accentColor={accent} />
          </div>

          <Link
            href="/demos/data-analyst"
            className="w-fit text-sm transition-opacity hover:opacity-70"
            style={{ color: "var(--muted)" }}
          >
            ← Volver a datasets
          </Link>
        </aside>

        {/* ═══════════════ RIGHT — chat (65%) ═══════════════ */}
        <section
          className="flex flex-col overflow-hidden rounded-2xl lg:flex-1"
          style={{
            border: "1px solid var(--border)",
            backgroundColor: "var(--surface)",
            height: "calc(100vh - 80px)",
            maxHeight: "820px",
          }}
        >
          <AnalystChatInterface
            datasetId={dataset.id}
            suggestedQuestions={dataset.suggestedQuestions}
          />
        </section>
      </div>
    </div>
  );
}
