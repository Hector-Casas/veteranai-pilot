/** Convert a table result to a CSV string (client-side). */
export function rowsToCSV(columns: string[], rows: unknown[][]): string {
  const escape = (v: unknown): string => {
    const str = v == null ? "" : String(v);
    // Wrap in quotes if contains comma, quote, or newline
    return str.includes(",") || str.includes('"') || str.includes("\n")
      ? `"${str.replace(/"/g, '""')}"`
      : str;
  };
  const header = columns.map(escape).join(",");
  const body = rows.map((row) => row.map(escape).join(",")).join("\n");
  return `${header}\n${body}`;
}

/** Trigger a CSV file download in the browser. */
export function downloadCSV(csv: string, filename: string): void {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  triggerDownload(url, filename);
  URL.revokeObjectURL(url);
}

/** Trigger a PNG file download from a base64 string. */
export function downloadPNG(base64: string, filename: string): void {
  const url = `data:image/png;base64,${base64}`;
  triggerDownload(url, filename);
}

function triggerDownload(url: string, filename: string): void {
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
