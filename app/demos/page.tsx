import { MessageSquare, BarChart3 } from "lucide-react";
import Link from "next/link";
import DemoCard from "@/components/DemoCard";

export const metadata = {
  title: "Live Demos — Veteran AI",
  description:
    "Interactive demos of AI-powered tools we build for our clients. Try them hands-on.",
};

export default function DemosPage() {
  return (
    <div className="flex flex-1 flex-col">
      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-20">
        {/* ── Section 1: Header ───────────────────────────── */}
        <section className="mb-16 max-w-2xl">
          <p
            className="mb-3 text-sm font-semibold uppercase tracking-widest"
            style={{ color: "var(--accent)" }}
          >
            Interactive demos
          </p>
          <h1 className="mb-5 text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            Live Demos
          </h1>
          <p className="text-base leading-relaxed" style={{ color: "var(--muted)" }}>
            These are functional examples of solutions we implement for our
            clients. Try them directly and experience first-hand what AI can do
            for your business.
          </p>
        </section>

        {/* ── Section 2: Demo grid ─────────────────────────── */}
        <section className="mb-24">
          <div className="grid gap-6 sm:grid-cols-2">
            <DemoCard
              icon={MessageSquare}
              title="Build your own AI assistant"
              description="Pick an industry and a set of capabilities, and we'll generate a live, in-character demo chatbot for a fictional business in seconds — no forms, no setup."
              techTags={[
                "Dynamic prompting",
                "Streaming responses",
                "5 industries",
                "Mistral Large 3",
              ]}
              href="/demos/chatbot"
            />

            <DemoCard
              icon={BarChart3}
              title="AI Data Analyst"
              description="Upload a CSV or Excel file and chat with your data. The assistant generates reports, charts, and insights from natural-language prompts."
              techTags={[
                "Data analysis",
                "Visualizations",
                "Python sandbox",
                "Mistral Large 3",
              ]}
              href="/demos/data-analyst"
            />
          </div>
        </section>

        {/* ── Section 3: CTA ──────────────────────────────── */}
        <section
          className="rounded-2xl px-10 py-12 text-center"
          style={{
            backgroundColor: "var(--surface)",
            border: "1px solid var(--border)",
          }}
        >
          <h2 className="mb-3 text-2xl font-bold text-foreground">
            Need something different?
          </h2>
          <p className="mx-auto mb-8 max-w-md text-sm leading-relaxed" style={{ color: "var(--muted)" }}>
            These are just two examples. We design custom AI and Machine
            Learning solutions tailored to each business.
          </p>
          <Link
            href="/#contact"
            className="inline-flex items-center gap-2 rounded-full px-7 py-3 text-sm font-semibold transition-opacity hover:opacity-90"
            style={{ backgroundColor: "var(--accent)", color: "var(--background)" }}
          >
            Schedule a call →
          </Link>
        </section>
      </main>
    </div>
  );
}
