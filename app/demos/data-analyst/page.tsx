import Link from "next/link";
import { BarChart3 } from "lucide-react";
import DatasetCard from "@/components/DatasetCard";
import { DATASETS } from "@/lib/datasets/schemas";

export const metadata = {
  title: "AI Data Analyst — Veteran AI",
  description:
    "Select a dataset and chat with your data. The assistant generates SQL queries, reports, and charts from natural-language prompts.",
};

export default function DataAnalystPage() {
  return (
    <div className="flex flex-1 flex-col">
      {/* ── Header ── */}
      <header
        className="flex items-center gap-4 border-b px-6 py-4"
        style={{ borderColor: "var(--border)" }}
      >
        <h1 className="text-sm font-semibold text-foreground">AI Data Analyst</h1>
        <span
          className="ml-auto flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium"
          style={{ backgroundColor: "var(--accent-dim)", color: "var(--accent)" }}
        >
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current" />
          Live demo
        </span>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-16">
        {/* ── Hero ── */}
        <section className="mb-14 max-w-2xl">
          <div
            className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl"
            style={{ backgroundColor: "var(--accent-dim)", color: "var(--accent)" }}
          >
            <BarChart3 size={24} strokeWidth={1.5} />
          </div>
          <h2 className="mb-4 text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            AI Data Analyst
          </h2>
          <p className="text-base leading-relaxed" style={{ color: "var(--muted)" }}>
            Select a dataset to start analyzing. The assistant understands
            natural-language questions, runs SQL queries, and generates charts
            with Python (pandas + matplotlib).
          </p>
        </section>

        {/* ── Dataset grid ── */}
        <section className="mb-20">
          <p
            className="mb-6 text-xs font-semibold uppercase tracking-widest"
            style={{ color: "var(--accent)" }}
          >
            Choose a dataset
          </p>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {DATASETS.map((ds) => (
              <DatasetCard key={ds.id} dataset={ds} />
            ))}
          </div>
        </section>

        {/* ── CTA ── */}
        <section
          className="rounded-2xl px-10 py-10 text-center"
          style={{
            backgroundColor: "var(--surface)",
            border: "1px solid var(--border)",
          }}
        >
          <h3 className="mb-3 text-xl font-bold text-foreground">
            Have your own data?
          </h3>
          <p className="mx-auto mb-6 max-w-sm text-sm leading-relaxed" style={{ color: "var(--muted)" }}>
            These are examples with synthetic data. We can build an analyst
            connected to your real database or Excel files.
          </p>
          <Link
            href="/#contact"
            className="inline-flex items-center gap-2 rounded-full px-6 py-2.5 text-sm font-semibold transition-opacity hover:opacity-90"
            style={{ backgroundColor: "var(--accent)", color: "var(--background)" }}
          >
            Tell us about your case →
          </Link>
        </section>
      </main>
    </div>
  );
}
