export default function FinalCta() {
  return (
    <section id="contact" className="mx-auto w-full max-w-6xl px-6 py-24">
      <div
        className="relative overflow-hidden rounded-3xl px-10 py-16 text-center"
        style={{ backgroundColor: "var(--surface-light)", border: "1px solid var(--border-light)" }}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10"
          style={{
            background:
              "radial-gradient(60% 80% at 50% 100%, color-mix(in srgb, var(--brand-red) 12%, transparent), transparent)",
          }}
        />

        <h2 className="font-heading mb-4 text-3xl font-semibold tracking-tight text-text-primary sm:text-4xl">
          Ready to talk?
        </h2>
        <p className="mx-auto mb-9 max-w-md text-sm leading-relaxed text-text-secondary sm:text-base">
          Book a free 30-minute discovery call. We&apos;ll look at your business and
          point out the highest-ROI places to put AI to work.
        </p>
        {/* TODO: point at the real Cal.com booking link before launch */}
        <a
          href="mailto:contact@veteranai.com"
          className="inline-flex items-center gap-2 rounded-full bg-brand-navy px-8 py-3.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
        >
          Book a discovery call →
        </a>
      </div>
    </section>
  );
}
