import { tool } from "ai";
import { z } from "zod";
import { createBooking } from "@/lib/cal/client";
import { sendBookingNotificationEmail } from "@/lib/email/send-booking-notification";

const DURATION_MINUTES = 30;

type BookMeetingOutput =
  | {
      success: true;
      bookingUid: string;
      meetingUrl?: string;
      formattedDateTime: string;
      fallbackBookingUrl: string;
    }
  | { success: false; error: string; fallbackBookingUrl: string };

export const bookMeetingTool = tool({
  description:
    "Agenda una reunión en el calendario de la consultora en un horario específico. " +
    "Solo invocar DESPUÉS de que el usuario haya: (1) confirmado un horario específico " +
    "de los disponibles que se le mostraron, (2) proporcionado nombre y email, " +
    "(3) confirmado explícitamente que quiere agendar.",
  inputSchema: z.object({
    startUTC: z
      .string()
      .describe("ISO 8601 con Z del slot elegido convertido a UTC. Ej: 2025-05-10T15:00:00.000Z"),
    attendeeName: z.string().min(2).describe("Nombre completo del asistente"),
    attendeeEmail: z.string().email().describe("Email del asistente"),
    attendeeTimeZone: z
      .string()
      .default("America/Mexico_City")
      .describe("Zona horaria IANA del asistente"),
    notes: z
      .string()
      .optional()
      .describe("Contexto breve del proyecto o pregunta que quiere tratar en la llamada"),
    conversationSummary: z
      .string()
      .min(30)
      .describe(
        "Párrafo de 3-5 oraciones en español neutro: por qué quiere la reunión, qué problema tiene, contexto relevante."
      ),
    company: z.string().optional().describe("Empresa u organización (opcional)"),
    phone: z.string().optional().describe("Teléfono (opcional)"),
  }),
  execute: async (input): Promise<BookMeetingOutput> => {
    const fallbackBookingUrl = process.env.NEXT_PUBLIC_CAL_BOOKING_URL ?? "https://cal.com";

    // Validate the date before hitting the Cal.com API
    const startDate = new Date(input.startUTC);
    if (isNaN(startDate.getTime())) {
      return { success: false, error: "Fecha inválida (formato ISO incorrecto)", fallbackBookingUrl };
    }
    if (startDate.getTime() < Date.now()) {
      return { success: false, error: "La fecha está en el pasado", fallbackBookingUrl };
    }
    if (startDate.getTime() > Date.now() + 1000 * 60 * 60 * 24 * 90) {
      return { success: false, error: "La fecha está a más de 90 días, fuera de rango razonable", fallbackBookingUrl };
    }

    const result = await createBooking({
      startUTC: input.startUTC,
      attendeeName: input.attendeeName,
      attendeeEmail: input.attendeeEmail,
      attendeeTimeZone: input.attendeeTimeZone,
      notes: input.notes,
    });

    if (!result.success) {
      return { success: false, error: result.error, fallbackBookingUrl };
    }

    // Format the confirmed time for the bot's response message
    const formattedDateTime = new Intl.DateTimeFormat("es-MX", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
      timeZone: input.attendeeTimeZone,
      timeZoneName: "short",
    }).format(new Date(input.startUTC));

    // Fire-and-forget email notification — a failure here must NOT break the booking
    sendBookingNotificationEmail({
      attendee: {
        name: input.attendeeName,
        email: input.attendeeEmail,
        company: input.company,
        phone: input.phone,
      },
      meeting: {
        startISO: input.startUTC,
        timeZone: input.attendeeTimeZone,
        durationMinutes: DURATION_MINUTES,
        meetingUrl: result.meetingUrl,
        bookingUid: result.bookingUid,
      },
      conversationSummary: input.conversationSummary,
      notes: input.notes,
    }).catch((err) => console.error("[book_meeting] Email notification failed:", err));

    return {
      success: true,
      bookingUid: result.bookingUid,
      meetingUrl: result.meetingUrl,
      formattedDateTime,
      fallbackBookingUrl,
    };
  },
});
