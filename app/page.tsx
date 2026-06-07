import Link from "next/link";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-6 py-24 text-center">
      <p className="text-sm font-medium tracking-widest uppercase text-accent">
        Veteran AI
      </p>
      <h1 className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
        AI & Machine Learning Consulting
      </h1>
      <p className="max-w-md text-base text-muted leading-relaxed">
        We design and build custom AI solutions for businesses. Check out our
        interactive demos below.
      </p>
      <Link
        href="/demos"
        className="mt-4 inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-semibold text-background transition-opacity hover:opacity-90"
      >
        Explore Demos →
      </Link>
    </main>
  );
}
