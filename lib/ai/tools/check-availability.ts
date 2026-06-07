import { tool } from "ai";
import { z } from "zod";
import { formatSlotsForUser, getAvailableSlots } from "@/lib/cal/client";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const MAX_RANGE_DAYS = 14;

type CheckAvailabilityOutput =
  | { success: true; formattedSlots: string; rawSlots: Record<string, string[]>; timeZone: string }
  | { success: false; error: string };

export const checkAvailabilityTool = tool({
  description:
    "Consulta la disponibilidad de horarios en el calendario de la consultora para un rango de fechas. " +
    "Úsalo cuando el usuario quiera agendar una reunión y necesites mostrarle los horarios disponibles. " +
    "Devuelve los slots disponibles agrupados por día.",
  inputSchema: z.object({
    startDate: z
      .string()
      .regex(DATE_RE, "Debe ser YYYY-MM-DD")
      .describe("Fecha de inicio del rango (YYYY-MM-DD, no puede ser en el pasado)"),
    endDate: z
      .string()
      .regex(DATE_RE, "Debe ser YYYY-MM-DD")
      .describe("Fecha fin del rango (YYYY-MM-DD, máximo 14 días después de startDate)"),
    timeZone: z
      .string()
      .optional()
      .describe('Zona horaria IANA del usuario. Default: "America/Mexico_City"'),
  }),
  execute: async (input): Promise<CheckAvailabilityOutput> => {
    const tz = input.timeZone ?? "America/Mexico_City";

    // Clamp startDate to today if it's in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let start = new Date(input.startDate + "T00:00:00");
    if (start < today) start = today;

    // Clamp range to MAX_RANGE_DAYS
    let end = new Date(input.endDate + "T00:00:00");
    const maxEnd = new Date(start);
    maxEnd.setDate(maxEnd.getDate() + MAX_RANGE_DAYS);
    if (end > maxEnd) end = maxEnd;
    // Ensure at least 1 day range
    if (end <= start) end = new Date(start.getTime() + 86_400_000);

    const toDateStr = (d: Date) => d.toISOString().slice(0, 10);

    const result = await getAvailableSlots({
      startDate: toDateStr(start),
      endDate: toDateStr(end),
      timeZone: tz,
    });

    if (!result.success) {
      return { success: false, error: result.error };
    }

    const formattedSlots = formatSlotsForUser(result.slotsByDate, tz);
    return {
      success: true,
      formattedSlots,
      rawSlots: result.slotsByDate,
      timeZone: tz,
    };
  },
});
