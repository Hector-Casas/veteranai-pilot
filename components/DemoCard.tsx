import Link from "next/link";
import type { LucideIcon } from "lucide-react";

type DemoCardProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  techTags: string[];
  href: string;
  ctaLabel?: string;
};

export default function DemoCard({
  icon: Icon,
  title,
  description,
  techTags,
  href,
  ctaLabel = "Try demo",
}: DemoCardProps) {
  return (
    <Link href={href} className="block h-full">
      <div
        className="demo-card flex h-full flex-col rounded-2xl p-8"
        style={{
          backgroundColor: "var(--surface)",
          border: "1px solid var(--border)",
        }}
      >
        {/* Icon badge */}
        <div
          className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-xl"
          style={{ backgroundColor: "var(--accent-dim)", color: "var(--accent)" }}
        >
          <Icon size={22} strokeWidth={1.75} />
        </div>

        {/* Title */}
        <h3 className="mb-3 text-lg font-semibold leading-snug text-foreground">
          {title}
        </h3>

        {/* Description */}
        <p className="mb-6 flex-1 text-sm leading-relaxed" style={{ color: "var(--muted)" }}>
          {description}
        </p>

        {/* Tech tags */}
        <div className="mb-7 flex flex-wrap gap-2">
          {techTags.map((tag) => (
            <span
              key={tag}
              className="rounded-full px-3 py-1 text-xs font-medium"
              style={{ backgroundColor: "var(--accent-dim)", color: "var(--accent)" }}
            >
              {tag}
            </span>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-auto flex items-center gap-2">
          <span className="text-sm font-semibold" style={{ color: "var(--accent)" }}>
            {ctaLabel}
          </span>
          <span
            className="demo-card-arrow text-sm transition-transform duration-200"
            style={{ color: "var(--accent)" }}
            aria-hidden
          >
            →
          </span>
        </div>
      </div>
    </Link>
  );
}
