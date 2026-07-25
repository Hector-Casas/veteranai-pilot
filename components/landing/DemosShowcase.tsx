import { BarChart3, MessageSquare } from "lucide-react";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";

type DemoCardLightProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  techTags: string[];
  href: string;
};

// Light-theme card local to the landing page. DemoCard.tsx (components/) is
// shared with the dark /demos listing page and is intentionally left alone —
// duplicating this small bit of markup avoids leaking the light palette there.
function DemoCardLight({ icon: Icon, title, description, techTags, href }: DemoCardLightProps) {
  return (
    <Link href={href} className="block h-full">
      <div
        className="demo-card-light flex h-full flex-col rounded-2xl p-8"
        style={{ backgroundColor: "var(--surface-light)", border: "1px solid var(--border-light)" }}
      >
        <div
          className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-xl"
          style={{
            backgroundColor: "color-mix(in srgb, var(--brand-navy) 10%, white)",
            color: "var(--brand-navy)",
          }}
        >
          <Icon size={22} strokeWidth={1.75} />
        </div>

        <h3 className="mb-3 text-lg font-semibold leading-snug text-text-primary">{title}</h3>

        <p className="mb-6 flex-1 text-sm leading-relaxed text-text-secondary">{description}</p>

        <div className="mb-7 flex flex-wrap gap-2">
          {techTags.map((tag) => (
            <span
              key={tag}
              className="rounded-full px-3 py-1 text-xs font-medium"
              style={{
                backgroundColor: "color-mix(in srgb, var(--brand-navy) 10%, white)",
                color: "var(--brand-navy)",
              }}
            >
              {tag}
            </span>
          ))}
        </div>

        <div className="mt-auto flex items-center gap-2">
          <span className="text-sm font-semibold text-brand-navy">Try demo</span>
          <span
            className="demo-card-light-arrow text-sm text-brand-navy transition-transform duration-200"
            aria-hidden
          >
            →
          </span>
        </div>
      </div>
    </Link>
  );
}

export default function DemosShowcase() {
  return (
    <section
      id="demos"
      className="border-y px-6 py-24"
      style={{ borderColor: "var(--border-light)", backgroundColor: "var(--page-base)" }}
    >
      <div className="mx-auto w-full max-w-6xl">
        <div className="mb-14 max-w-2xl">
          <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-brand-red">
            See it in action
          </p>
          <h2 className="font-heading text-3xl font-semibold tracking-tight text-text-primary sm:text-4xl">
            Live demos, not slideware
          </h2>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <DemoCardLight
            icon={MessageSquare}
            title="Customer Support Chatbot"
            description="Conversational assistant that answers questions about our services, automatically schedules meetings, and sends follow-up emails."
            techTags={["Function Calling", "Calendar API", "Email automation", "Mistral Large 3"]}
            href="/demos/chatbot"
          />

          <DemoCardLight
            icon={BarChart3}
            title="AI Data Analyst"
            description="Upload a CSV or Excel file and chat with your data. The assistant generates reports, charts, and insights from natural-language prompts."
            techTags={["Data analysis", "Visualizations", "Python sandbox", "Mistral Large 3"]}
            href="/demos/data-analyst"
          />
        </div>
      </div>
    </section>
  );
}
