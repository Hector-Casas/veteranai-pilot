type LeadData = {
  prospect: {
    name: string;
    email: string;
    company?: string;
    phone?: string;
    interest: string;
    urgency?: "alta" | "media" | "baja";
  };
  conversationSummary: string;
  timestamp: string;
};

const URGENCY_LABEL: Record<string, string> = {
  alta: "🔴 Alta",
  media: "🟡 Media",
  baja: "🟢 Baja",
};

export function buildLeadNotificationEmail(data: LeadData): {
  subject: string;
  html: string;
  text: string;
} {
  const { prospect, conversationSummary, timestamp } = data;
  const date = new Date(timestamp).toLocaleString("es-MX", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "America/New_York",
  });

  const subject = `🎯 Nuevo lead: ${prospect.name} — ${prospect.interest.slice(0, 60)}${prospect.interest.length > 60 ? "…" : ""}`;

  const rows = [
    ["Nombre", prospect.name],
    ["Email", `<a href="mailto:${prospect.email}" style="color:#0066cc">${prospect.email}</a>`],
    ...(prospect.company ? [["Empresa", prospect.company]] : []),
    ...(prospect.phone ? [["Teléfono", prospect.phone]] : []),
    ["Interés / necesidad", prospect.interest],
    ...(prospect.urgency ? [["Urgencia", URGENCY_LABEL[prospect.urgency] ?? prospect.urgency]] : []),
  ] as [string, string][];

  const tableRows = rows
    .map(
      ([label, value]) => `
      <tr>
        <td style="padding:10px 16px;border-bottom:1px solid #f0f0f0;font-weight:600;color:#374151;white-space:nowrap;width:140px;vertical-align:top;font-size:13px">${label}</td>
        <td style="padding:10px 16px;border-bottom:1px solid #f0f0f0;color:#1f2937;font-size:13px">${value}</td>
      </tr>`
    )
    .join("");

  const html = `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:32px 16px">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1)">

        <!-- Header -->
        <tr>
          <td style="background:#0c0e12;padding:28px 32px">
            <p style="margin:0;font-size:11px;font-weight:600;letter-spacing:2px;text-transform:uppercase;color:#00d4ff">Veteran AI · Chatbot Demo</p>
            <h1 style="margin:8px 0 0;font-size:22px;font-weight:700;color:#ffffff">Nuevo lead capturado</h1>
          </td>
        </tr>

        <!-- Prospect data -->
        <tr>
          <td style="padding:28px 32px 16px">
            <h2 style="margin:0 0 16px;font-size:14px;font-weight:600;text-transform:uppercase;letter-spacing:1px;color:#6b7280">Datos del prospecto</h2>
            <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:8px;overflow:hidden">
              ${tableRows}
            </table>
          </td>
        </tr>

        <!-- Summary -->
        <tr>
          <td style="padding:16px 32px 28px">
            <h2 style="margin:0 0 12px;font-size:14px;font-weight:600;text-transform:uppercase;letter-spacing:1px;color:#6b7280">Resumen de la conversación</h2>
            <div style="background:#f8fafc;border-left:3px solid #00d4ff;border-radius:4px;padding:16px 20px">
              <p style="margin:0;font-size:14px;line-height:1.7;color:#374151">${conversationSummary.replace(/\n/g, "<br>")}</p>
            </div>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:20px 32px;border-top:1px solid #f0f0f0;background:#fafafa">
            <p style="margin:0;font-size:12px;color:#9ca3af">Capturado el ${date} · Generado automáticamente por el chatbot demo de Veteran AI</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const textRows = rows.map(([l, v]) => `${l}: ${v.replace(/<[^>]+>/g, "")}`).join("\n");
  const text = `NUEVO LEAD — Veteran AI Chatbot Demo
======================================

DATOS DEL PROSPECTO
${textRows}

RESUMEN DE LA CONVERSACIÓN
${conversationSummary}

---
Capturado el ${date}
Generado automáticamente por el chatbot demo de Veteran AI
`;

  return { subject, html, text };
}
