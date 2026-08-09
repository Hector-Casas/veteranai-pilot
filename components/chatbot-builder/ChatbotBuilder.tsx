"use client";

import { Briefcase, Home, ShoppingBag, Stethoscope, Utensils } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useState } from "react";
import { CATALOG, INDUSTRY_LABELS, IndustryKey } from "@/lib/prompts/chatbot-builder";
import GeneratedChatPanel from "./GeneratedChatPanel";

const INDUSTRY_ORDER: IndustryKey[] = ["restaurant", "sales", "clinic", "ecommerce", "realty"];

const INDUSTRY_ICONS: Record<IndustryKey, LucideIcon> = {
  restaurant: Utensils,
  sales: Briefcase,
  clinic: Stethoscope,
  ecommerce: ShoppingBag,
  realty: Home,
};

type Phase = 1 | 2 | 3;

const PHASE_STEPS: { n: Phase; label: string }[] = [
  { n: 1, label: "Industry" },
  { n: 2, label: "Capabilities" },
  { n: 3, label: "Your chatbot" },
];

export default function ChatbotBuilder() {
  const [phase, setPhase] = useState<Phase>(1);
  const [industryKey, setIndustryKey] = useState<IndustryKey | null>(null);
  const [capabilities, setCapabilities] = useState<string[]>([]);

  const handleSelectIndustry = (key: IndustryKey) => {
    setIndustryKey(key);
    setCapabilities([]);
  };

  const handleContinue = () => {
    if (!industryKey) return;
    setPhase(2);
  };

  const toggleCapability = (label: string) => {
    setCapabilities((prev) =>
      prev.includes(label) ? prev.filter((c) => c !== label) : [...prev, label]
    );
  };

  const handleBuild = () => {
    if (capabilities.length === 0) return;
    setPhase(3);
  };

  const handleBackToIndustry = () => {
    setPhase(1);
    setCapabilities([]);
  };

  const handleRebuild = () => {
    setPhase(2);
  };

  const industry = industryKey ? CATALOG[industryKey] : null;
  // Any change to industry or capabilities produces a new signature, which
  // is used as the chat panel's React key — that forces a full remount
  // (and therefore a fresh useChat/message history) on every rebuild.
  const configSignature = industryKey
    ? `${industryKey}::${[...capabilities].sort().join("|")}`
    : "";

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-12">
      {/* ── Phase indicator ── */}
      <div className="mb-10 flex items-center justify-center gap-2 text-xs font-medium">
        {PHASE_STEPS.map((step, i) => (
          <span key={step.n} className="flex items-center gap-2">
            <span
              className="flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-semibold"
              style={{
                backgroundColor: phase >= step.n ? "var(--brand-navy)" : "var(--surface-hover)",
                color: phase >= step.n ? "#ffffff" : "var(--muted)",
              }}
            >
              {step.n}
            </span>
            <span style={{ color: phase === step.n ? "var(--text-primary)" : "var(--muted)" }}>
              {step.label}
            </span>
            {i < PHASE_STEPS.length - 1 && (
              <span className="mx-1" style={{ color: "var(--border)" }}>
                —
              </span>
            )}
          </span>
        ))}
      </div>

      {/* ── Phase 1: industry selection ── */}
      {phase === 1 && (
        <section>
          <div className="mb-8 text-center">
            <h2 className="mb-2 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              Pick an industry
            </h2>
            <p className="text-sm" style={{ color: "var(--muted)" }}>
              We&apos;ll generate a live demo chatbot for a fictional business in that space.
            </p>
          </div>

          <div className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {INDUSTRY_ORDER.map((key) => {
              const Icon = INDUSTRY_ICONS[key];
              const isSelected = industryKey === key;
              return (
                <button
                  key={key}
                  onClick={() => handleSelectIndustry(key)}
                  className="rounded-2xl p-6 text-left transition-all"
                  style={{
                    backgroundColor: isSelected
                      ? "color-mix(in srgb, var(--brand-navy) 6%, white)"
                      : "var(--surface)",
                    border: isSelected ? "2px solid var(--brand-navy)" : "1px solid var(--border)",
                  }}
                >
                  <div
                    className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl"
                    style={{ backgroundColor: "var(--accent-dim)", color: "var(--accent)" }}
                  >
                    <Icon size={20} strokeWidth={1.75} />
                  </div>
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--muted)" }}>
                    {INDUSTRY_LABELS[key]}
                  </p>
                  <p className="text-lg font-semibold text-foreground">{CATALOG[key].persona}</p>
                </button>
              );
            })}
          </div>

          <div className="flex justify-center">
            <button
              onClick={handleContinue}
              disabled={!industryKey}
              className="rounded-full px-7 py-3 text-sm font-semibold text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
              style={{ backgroundColor: "var(--brand-navy)" }}
            >
              Continue →
            </button>
          </div>
        </section>
      )}

      {/* ── Phase 2: capabilities ── */}
      {phase === 2 && industry && (
        <section className="mx-auto max-w-xl">
          <div className="mb-8 text-center">
            <p
              className="mb-2 text-xs font-semibold uppercase tracking-widest"
              style={{ color: "var(--accent)" }}
            >
              Building {industry.persona}
            </p>
            <h2 className="mb-2 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              What should it help with?
            </h2>
            <p className="text-sm" style={{ color: "var(--muted)" }}>
              Pick at least one capability for your demo assistant.
            </p>
          </div>

          <div className="mb-8 space-y-3">
            {industry.capabilities.map((cap) => {
              const checked = capabilities.includes(cap);
              return (
                <label
                  key={cap}
                  className="flex cursor-pointer items-center gap-3 rounded-xl p-4 transition-colors"
                  style={{
                    backgroundColor: checked
                      ? "color-mix(in srgb, var(--brand-navy) 5%, white)"
                      : "var(--surface)",
                    border: checked ? "1px solid var(--brand-navy)" : "1px solid var(--border)",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleCapability(cap)}
                    className="h-4 w-4 shrink-0"
                    style={{ accentColor: "var(--brand-navy)" }}
                  />
                  <span className="text-sm text-foreground">{cap}</span>
                </label>
              );
            })}
          </div>

          <div className="flex items-center justify-center gap-3">
            <button
              onClick={handleBackToIndustry}
              className="rounded-full px-5 py-3 text-sm font-semibold transition-opacity hover:opacity-70"
              style={{ border: "1px solid var(--border)", color: "var(--text-primary)" }}
            >
              ← Back
            </button>
            <button
              onClick={handleBuild}
              disabled={capabilities.length === 0}
              className="rounded-full px-7 py-3 text-sm font-semibold text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
              style={{ backgroundColor: "var(--brand-navy)" }}
            >
              Build chatbot →
            </button>
          </div>
        </section>
      )}

      {/* ── Phase 3: config summary + generated chatbot ── */}
      {phase === 3 && industryKey && industry && (
        <section className="grid grid-cols-1 gap-6 lg:grid-cols-[320px_1fr]">
          {/* Left: config summary */}
          <div
            className="flex h-fit flex-col gap-5 rounded-2xl p-6"
            style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}
          >
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--muted)" }}>
                Industry
              </p>
              <p className="text-sm font-semibold text-foreground">
                {INDUSTRY_LABELS[industryKey]} — {industry.persona}
              </p>
            </div>
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--muted)" }}>
                Capabilities
              </p>
              <ul className="space-y-1.5">
                {capabilities.map((c) => (
                  <li key={c} className="text-sm text-foreground">
                    • {c}
                  </li>
                ))}
              </ul>
            </div>
            <button
              onClick={handleRebuild}
              className="mt-1 rounded-full px-4 py-2.5 text-sm font-semibold transition-opacity hover:opacity-70"
              style={{ border: "1px solid var(--border)", color: "var(--text-primary)" }}
            >
              Rebuild chatbot
            </button>
          </div>

          {/* Right: generated chatbot — keyed by config so a rebuild with a
              different config always starts a fresh conversation */}
          <div className="h-[560px] lg:h-[calc(100vh-260px)] lg:max-h-[720px]">
            <GeneratedChatPanel
              key={configSignature}
              industryKey={industryKey}
              capabilities={capabilities}
            />
          </div>
        </section>
      )}
    </main>
  );
}
