type BookingData = {
  attendee: {
    name: string;
    email: string;
    company?: string;
    phone?: string;
  };
  meeting: {
    startISO: string;
    timeZone: string;
    durationMinutes: number;
    meetingUrl?: string;
    bookingUid: string;
  };
  conversationSummary: string;
  notes?: string;
};

export function buildBookingNotificationEmail(data: BookingData): {
  subject: string;
  html: string;
  text: string;
} {
  const { attendee, meeting, conversationSummary, notes } = data;

  const dateFormatter = new Intl.DateTimeFormat("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: meeting.timeZone,
  });
  const timeFormatter = new Intl.DateTimeFormat("es-MX", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: meeting.timeZone,
    timeZoneName: "short",
  });

  const meetingDate = new Date(meeting.startISO);
  const dateLabel =
    dateFormatter.format(meetingDate).charAt(0).toUpperCase() +
    dateFormatter.format(meetingDate).slice(1);
  const timeLabel = timeFormatter.format(meetingDate);

  const subject = `📅 Nueva reunión agendada: ${attendee.name} — ${dateLabel} ${timeLabel}`;

  const attendeeRows = [
    ["Nombre", attendee.name],
    ["Email", `<a href="mailto:${attendee.email}" style="color:#0066cc">${attendee.email}</a>`],
    ...(attendee.company ? [["Empresa", attendee.company]] : []),
    ...(attendee.phone ? [["Teléfono", attendee.phone]] : []),
  ] as [string, string][];

  const tableRows = attendeeRows
    .map(
      ([label, value]) => `
      <tr>
        <td style="padding:10px 16px;border-bottom:1px solid #f0f0f0;font-weight:600;color:#374151;white-space:nowrap;width:120px;vertical-align:top;font-size:13px">${label}</td>
        <td style="padding:10px 16px;border-bottom:1px solid #f0f0f0;color:#1f2937;font-size:13px">${value}</td>
      </tr>`
    )
    .join("");

  const meetingUrlSection = meeting.meetingUrl
    ? `<p style="margin:0 0 8px"><strong>Link de la videollamada:</strong><br>
       <a href="${meeting.meetingUrl}" style="color:#0066cc;word-break:break-all">${meeting.meetingUrl}</a></p>`
    : "";

  const notesSection = notes
    ? `<tr>
          <td style="padding:28px 32px 0;border-top:1px solid #f0f0f0">
            <h2 style="margin:0 0 12px;font-size:14px;font-weight:600;text-transform:uppercase;letter-spacing:1px;color:#6b7280">Notas del proyecto</h2>
            <div style="background:#fffbeb;border-left:3px solid #f59e0b;border-radius:4px;padding:14px 18px">
              <p style="margin:0;font-size:14px;line-height:1.7;color:#374151">${notes.replace(/\n/g, "<br>")}</p>
            </div>
          </td>
        </tr>`
    : "";

  const calManageUrl = `https://app.cal.com/bookings/${meeting.bookingUid}`;

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
            <h1 style="margin:8px 0 0;font-size:22px;font-weight:700;color:#ffffff">Nueva reunión agendada</h1>
          </td>
        </tr>

        <!-- Meeting highlight -->
        <tr>
          <td style="padding:28px 32px 20px;background:#f0fdf4;border-bottom:1px solid #dcfce7">
            <p style="margin:0 0 4px;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:1px;color:#16a34a">Fecha y hora confirmadas</p>
            <p style="margin:0;font-size:22px;font-weight:700;color:#111827">${dateLabel}</p>
            <p style="margin:4px 0 0;font-size:16px;color:#374151">${timeLabel} · ${meeting.durationMinutes} minutos</p>
            ${meetingUrlSection}
          </td>
        </tr>

        <!-- Attendee data -->
        <tr>
          <td style="padding:28px 32px 16px">
            <h2 style="margin:0 0 16px;font-size:14px;font-weight:600;text-transform:uppercase;letter-spacing:1px;color:#6b7280">Datos del asistente</h2>
            <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:8px;overflow:hidden">
              ${tableRows}
            </table>
          </td>
        </tr>

        ${notesSection}

        <!-- Conversation summary -->
        <tr>
          <td style="padding:${notes ? "20px" : "16px"} 32px 28px">
            <h2 style="margin:0 0 12px;font-size:14px;font-weight:600;text-transform:uppercase;letter-spacing:1px;color:#6b7280">Resumen de la conversación</h2>
            <div style="background:#f8fafc;border-left:3px solid #00d4ff;border-radius:4px;padding:16px 20px">
              <p style="margin:0;font-size:14px;line-height:1.7;color:#374151">${conversationSummary.replace(/\n/g, "<br>")}</p>
            </div>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:20px 32px;border-top:1px solid #f0f0f0;background:#fafafa">
            <p style="margin:0 0 6px;font-size:12px;color:#9ca3af">Booking UID: ${meeting.bookingUid}</p>
            <p style="margin:0;font-size:12px;color:#9ca3af">
              <a href="${calManageUrl}" style="color:#0066cc">Gestionar en Cal.com</a> · Agendado automáticamente por el chatbot demo de Veteran AI
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const textAttendee = attendeeRows
    .map(([l, v]) => `${l}: ${v.replace(/<[^>]+>/g, "")}`)
    .join("\n");

  const text = `NUEVA REUNIÓN AGENDADA — Veteran AI Chatbot Demo
=================================================

FECHA Y HORA
${dateLabel} — ${timeLabel}
Duración: ${meeting.durationMinutes} minutos
${meeting.meetingUrl ? `Link: ${meeting.meetingUrl}` : ""}

ASISTENTE
${textAttendee}

${notes ? `NOTAS DEL PROYECTO\n${notes}\n` : ""}RESUMEN DE LA CONVERSACIÓN
${conversationSummary}

---
Booking UID: ${meeting.bookingUid}
Gestionar: ${calManageUrl}
Agendado automáticamente por el chatbot demo de Veteran AI
`;

  return { subject, html, text };
}
