import Link from "next/link";
import { BarChart3, LineChart, ShoppingCart, Users } from "lucide-react";
import type { DatasetSchema } from "@/lib/datasets/types";
import { getTotalRows } from "@/lib/datasets/schemas";

const ICON_MAP: Record<string, React.ComponentType<{ size?: number; strokeWidth?: number }>> = {
  ShoppingCart,
  LineChart,
  BarChart3,
  Users,
};

type Props = { dataset: DatasetSchema };

export default function DatasetCard({ dataset }: Props) {
  const Icon = ICON_MAP[dataset.icon] ?? BarChart3;
  const totalRows = getTotalRows(dataset).toLocaleString("en-US");
  const accent = dataset.accentColor;
  const accentDim = `${accent}18`; // 18 ≈ 10% opacity in hex

  return (
    <Link href={`/demos/data-analyst/${dataset.id}`} className="block h-full">
      <div
        className="dataset-card flex h-full flex-col rounded-2xl p-8"
        style={{
          backgroundColor: "var(--surface)",
          border: "1px solid var(--border)",
          // CSS var overrides for the hover class defined in globals.css
          ["--card-accent" as string]: accent,
          ["--card-accent-dim" as string]: accentDim,
        }}
      >
        {/* Icon */}
        <div
          className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-xl"
          style={{ backgroundColor: accentDim, color: accent }}
        >
          <Icon size={22} strokeWidth={1.75} />
        </div>

        {/* Title */}
        <h3 className="mb-2 text-lg font-semibold leading-snug text-foreground">
          {dataset.name}
        </h3>

        {/* Description */}
        <p className="mb-5 flex-1 text-sm leading-relaxed" style={{ color: "var(--muted)" }}>
          {dataset.description}
        </p>

        {/* Badges */}
        <div className="mb-5 flex flex-wrap gap-2">
          {dataset.badges.map((badge) => (
            <span
              key={badge}
              className="rounded-full px-3 py-1 text-xs font-medium"
              style={{ backgroundColor: accentDim, color: accent }}
            >
              {badge}
            </span>
          ))}
        </div>

        {/* Stats row */}
        <div
          className="mb-6 flex items-center gap-4 text-xs"
          style={{ color: "var(--muted)" }}
        >
          <span>
            <span className="font-semibold text-foreground">{dataset.tables.length}</span> tables
          </span>
          <span className="h-3 w-px" style={{ backgroundColor: "var(--border)" }} />
          <span>
            <span className="font-semibold text-foreground">~{totalRows}</span> rows
          </span>
          <span className="h-3 w-px" style={{ backgroundColor: "var(--border)" }} />
          <span>synthetic data</span>
        </div>

        {/* CTA */}
        <div className="mt-auto flex items-center gap-2">
          <span className="text-sm font-semibold" style={{ color: accent }}>
            Explore dataset
          </span>
          <span
            className="dataset-card-arrow text-sm transition-transform duration-200"
            style={{ color: accent }}
            aria-hidden
          >
            →
          </span>
        </div>
      </div>
    </Link>
  );
}
