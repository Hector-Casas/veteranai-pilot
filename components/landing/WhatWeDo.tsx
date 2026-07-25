import { Bot, LineChart, Workflow } from "lucide-react";
import type { LucideIcon } from "lucide-react";

type Card = {
  icon: LucideIcon;
  title: string;
  description: string;
};

const CARDS: Card[] = [
  {
    icon: Bot,
    title: "Conversational Agents",
    description:
      "AI-powered chatbots and virtual assistants for customer service and sales, with CRM, calendar, and email integrations built in.",
  },
  {
    icon: LineChart,
    title: "Data Analysis Assistants",
    description:
      "Natural-language interfaces over your data — dashboards, predictive analytics, and reports generated from databases or spreadsheets.",
  },
  {
    icon: Workflow,
    title: "Process Automation",
    description:
      "Document extraction, ticket classification, and intelligent workflows that remove manual work from repetitive processes.",
  },
];

export default function WhatWeDo() {
  return (
    <section id="about" className="mx-auto w-full max-w-6xl px-6 py-24">
      <div className="mb-14 max-w-2xl">
        <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-brand-red">
          What we do
        </p>
        <h2 className="font-heading text-3xl font-semibold tracking-tight text-text-primary sm:text-4xl">
          AI solutions built end-to-end, owned by one team
        </h2>
      </div>

      <div className="grid gap-6 sm:grid-cols-3">
        {CARDS.map(({ icon: Icon, title, description }) => (
          <div
            key={title}
            className="flex flex-col rounded-2xl p-7"
            style={{ backgroundColor: "var(--surface-light)", border: "1px solid var(--border-light)" }}
          >
            <div
              className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-xl"
              style={{
                backgroundColor: "color-mix(in srgb, var(--brand-navy) 10%, white)",
                color: "var(--brand-navy)",
              }}
            >
              <Icon size={20} strokeWidth={1.75} />
            </div>
            <h3 className="font-heading mb-2 text-lg font-semibold text-text-primary">
              {title}
            </h3>
            <p className="text-sm leading-relaxed text-text-secondary">
              {description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
