export default function Footer() {
  return (
    <footer className="border-t px-6 py-10" style={{ borderColor: "var(--border-light)" }}>
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-4 text-center sm:flex-row sm:justify-between sm:text-left">
        <div>
          <p className="font-heading text-sm font-semibold text-text-primary">
            Veteran<span className="text-brand-red">AI</span>
          </p>
          <p className="mt-1 text-xs text-text-secondary">
            USA
          </p>
        </div>

        <div className="flex flex-col items-center gap-1 text-xs text-text-secondary sm:items-end">
          {/* TODO: replace with the real contact address before launch */}
          <a href="mailto:contact@veteranai.com" className="transition-opacity hover:opacity-70">
            contact@veteranai.com
          </a>
          {/* TODO: replace with the real LinkedIn company page URL */}
          <a href="#" className="transition-opacity hover:opacity-70">
            LinkedIn
          </a>
        </div>
      </div>

      <p className="mt-8 text-center text-xs text-text-secondary">
        © {new Date().getFullYear()} Veteran AI. All rights reserved.
      </p>
    </footer>
  );
}
