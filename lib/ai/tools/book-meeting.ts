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
    "Books a meeting on the consultancy's calendar at a specific time. " +
    "Only invoke AFTER the user has: (1) confirmed a specific time slot " +
    "from the ones shown to them, (2) provided name and email, " +
    "(3) explicitly confirmed they want to book.",
  inputSchema: z.object({
    startUTC: z
      .string()
      .describe("ISO 8601 with Z of the chosen slot converted to UTC. E.g.: 2025-05-10T15:00:00.000Z"),
    attendeeName: z.string().min(2).describe("Attendee's full name"),
    attendeeEmail: z.string().email().describe("Attendee's email"),
    attendeeTimeZone: z
      .string()
      .default("America/Mexico_City")
      .describe("Attendee's IANA time zone"),
    notes: z
      .string()
      .optional()
      .describe("Brief context about the project or question they want to discuss on the call"),
    conversationSummary: z
      .string()
      .min(30)
      .describe(
        "3-5 sentence paragraph in neutral English: why they want the meeting, what problem they have, relevant context."
      ),
    company: z.string().optional().describe("Company or organization (optional)"),
    phone: z.string().optional().describe("Phone number (optional)"),
  }),
  execute: async (input): Promise<BookMeetingOutput> => {
    const fallbackBookingUrl = process.env.NEXT_PUBLIC_CAL_BOOKING_URL ?? "https://cal.com";

    // Validate the date before hitting the Cal.com API
    const startDate = new Date(input.startUTC);
    if (isNaN(startDate.getTime())) {
      return { success: false, error: "Invalid date (incorrect ISO format)", fallbackBookingUrl };
    }
    if (startDate.getTime() < Date.now()) {
      return { success: false, error: "The date is in the past", fallbackBookingUrl };
    }
    if (startDate.getTime() > Date.now() + 1000 * 60 * 60 * 24 * 90) {
      return { success: false, error: "The date is more than 90 days out, outside a reasonable range", fallbackBookingUrl };
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
    const formattedDateTime = new Intl.DateTimeFormat("en-US", {
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
