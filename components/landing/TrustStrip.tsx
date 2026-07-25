import { Handshake, Layers, ShieldCheck } from "lucide-react";

const BADGES = [
  {
    icon: ShieldCheck,
    label: "SDVOSB certification in process",
  },
  {
    icon: Layers,
    label: "Full-stack ownership, from data to deployment",
  },
  {
    icon: Handshake,
    label: "Model-agnostic — we build around your stack, not ours",
  },
];

export default function TrustStrip() {
  return (
    <section
      className="border-y px-6 py-8"
      style={{ borderColor: "var(--border-light)", backgroundColor: "var(--page-base)" }}
    >
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-6 sm:flex-row sm:justify-between sm:gap-4">
        {BADGES.map(({ icon: Icon, label }) => (
          <div key={label} className="flex items-center gap-3 text-center sm:text-left">
            <span
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
              style={{
                backgroundColor: "color-mix(in srgb, var(--brand-navy) 10%, white)",
                color: "var(--brand-navy)",
              }}
            >
              <Icon size={16} strokeWidth={1.75} />
            </span>
            <p className="text-sm font-medium text-text-secondary">
              {label}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
