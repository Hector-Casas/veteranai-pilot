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
    "Checks calendar availability for the consultancy over a date range. " +
    "Use it when the user wants to book a meeting and you need to show them available times. " +
    "Returns available slots grouped by day.",
  inputSchema: z.object({
    startDate: z
      .string()
      .regex(DATE_RE, "Must be YYYY-MM-DD")
      .describe("Start date of the range (YYYY-MM-DD, cannot be in the past)"),
    endDate: z
      .string()
      .regex(DATE_RE, "Must be YYYY-MM-DD")
      .describe("End date of the range (YYYY-MM-DD, maximum 14 days after startDate)"),
    timeZone: z
      .string()
      .optional()
      .describe('User\'s IANA time zone. Default: "America/Mexico_City"'),
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
