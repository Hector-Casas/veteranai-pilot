import Link from "next/link";

export default function Hero() {
  return (
    <section className="relative isolate overflow-hidden bg-page-base px-6 py-28 sm:py-36">
      {/* Three organic "lava lamp" blobs over the page-base background — soft,
          translucent, contained to the hero, sitting behind the copy/CTAs.
          This wrapper is the positioned containing block the blobs are
          offset against (it exactly fills the hero section via inset-0). */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        {/* Coral blob, top-right — sized/positioned as a % of the hero
            section (this wrapper's own box), so it scales with viewport
            width instead of staying a fixed pixel size. */}
        <div
          style={{
            position: "absolute",
            top: "-18%",
            right: "-14%",
            width: "42%",
            aspectRatio: "1.15 / 1",
            borderRadius: "58% 42% 35% 65% / 55% 40% 60% 45%",
            background: "rgba(240, 97, 101, 0.42)",
            filter: "blur(clamp(20px, 3vw, 60px))",
          }}
        />
        {/* Deep blue blob, bottom-left */}
        <div
          style={{
            position: "absolute",
            bottom: "-20%",
            left: "-12%",
            width: "44%",
            aspectRatio: "1.15 / 1",
            borderRadius: "40% 60% 65% 35% / 45% 55% 45% 55%",
            background: "rgba(0, 14, 155, 0.36)",
            filter: "blur(clamp(20px, 3vw, 60px))",
          }}
        />
        {/* White highlight, upper-left-center */}
        <div
          style={{
            position: "absolute",
            top: "8%",
            left: "28%",
            width: "20%",
            aspectRatio: "1.2 / 1",
            borderRadius: "50% 50% 60% 40% / 55% 45% 55% 45%",
            background: "rgba(255, 255, 255, 0.5)",
            filter: "blur(clamp(16px, 2.2vw, 45px))",
          }}
        />
      </div>

      <div className="mx-auto flex max-w-3xl flex-col items-center gap-6 text-center">
        <p className="text-sm font-semibold uppercase tracking-widest text-brand-red">
          AI &amp; Machine Learning Consulting
        </p>

        <h1 className="font-heading text-4xl font-semibold tracking-tight text-text-primary sm:text-6xl">
          Discover how AI can transform your business
        </h1>

        <p className="max-w-xl text-base leading-relaxed text-text-secondary sm:text-lg">
          We design, build, and own end-to-end AI solutions — conversational agents,
          data analysis assistants, and process automation — tailored to how your
          business actually runs.
        </p>

        <div className="mt-4 flex flex-col items-center gap-4 sm:flex-row">
          <Link
            href="/demos"
            className="inline-flex items-center gap-2 rounded-full bg-brand-navy px-7 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            Try the live demos →
          </Link>
          <a
            href="#contact"
            className="inline-flex items-center gap-2 rounded-full border bg-surface-light px-7 py-3 text-sm font-semibold text-text-primary transition-opacity hover:opacity-70"
            style={{ borderColor: "var(--border-light)" }}
          >
            Book a discovery call
          </a>
        </div>
      </div>
    </section>
  );
}
