const CAL_BASE = "https://api.cal.com/v2";

function calHeaders(apiVersion: string): HeadersInit {
  const key = process.env.CAL_API_KEY;
  if (!key) throw new Error("[Veteran AI] CAL_API_KEY is not set in .env.local");
  return {
    Authorization: `Bearer ${key}`,
    "cal-api-version": apiVersion,
    "Content-Type": "application/json",
  };
}

// ── getAvailableSlots ──────────────────────────────────────────────────────

type SlotsResult =
  | { success: true; slotsByDate: Record<string, string[]> }
  | { success: false; error: string };

export async function getAvailableSlots(params: {
  startDate: string;
  endDate: string;
  timeZone?: string;
}): Promise<SlotsResult> {
  const eventTypeId = process.env.CAL_EVENT_TYPE_ID;
  if (!eventTypeId) return { success: false, error: "CAL_EVENT_TYPE_ID not configured" };

  const tz = params.timeZone ?? "America/Mexico_City";
  const url = new URL(`${CAL_BASE}/slots`);
  url.searchParams.set("eventTypeId", eventTypeId);
  url.searchParams.set("start", params.startDate);
  url.searchParams.set("end", params.endDate);
  url.searchParams.set("timeZone", tz);

  try {
    const res = await fetch(url.toString(), {
      headers: calHeaders("2024-09-04"),
      cache: "no-store",
    });

    const body = await res.json();

    if (!res.ok || body.status !== "success") {
      const msg = body?.error?.message ?? body?.message ?? `HTTP ${res.status}`;
      return { success: false, error: msg };
    }

    // Normalize: each date maps to an array of ISO start strings
    const raw: Record<string, { start: string }[]> = body.data ?? {};
    const slotsByDate: Record<string, string[]> = {};
    for (const [date, slots] of Object.entries(raw)) {
      slotsByDate[date] = (slots as { start: string }[]).map((s) => s.start);
    }

    return { success: true, slotsByDate };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Network error" };
  }
}

// ── createBooking ──────────────────────────────────────────────────────────

type BookingResult =
  | { success: true; bookingId: string; bookingUid: string; meetingUrl?: string }
  | { success: false; error: string };

export async function createBooking(params: {
  startUTC: string;
  attendeeName: string;
  attendeeEmail: string;
  attendeeTimeZone: string;
  notes?: string;
  metadata?: Record<string, string>;
}): Promise<BookingResult> {
  const eventTypeId = process.env.CAL_EVENT_TYPE_ID;
  if (!eventTypeId) return { success: false, error: "CAL_EVENT_TYPE_ID not configured" };

  const body = {
    start: params.startUTC,
    eventTypeId: parseInt(eventTypeId, 10),
    attendee: {
      name: params.attendeeName,
      email: params.attendeeEmail,
      timeZone: params.attendeeTimeZone,
    },
    ...(params.notes ? { bookingFieldsResponses: { notes: params.notes } } : {}),
    ...(params.metadata ? { metadata: params.metadata } : {}),
  };

  try {
    const res = await fetch(`${CAL_BASE}/bookings`, {
      method: "POST",
      headers: calHeaders("2024-08-13"),
      body: JSON.stringify(body),
    });

    const json = await res.json();

    if (!res.ok || (json.status && json.status !== "success")) {
      console.error("[Cal.com API] Booking failed:", {
        status: res.status,
        statusText: res.statusText,
        body: JSON.stringify(json).slice(0, 500),
        payloadSent: {
          startUTC: params.startUTC,
          attendeeEmail: params.attendeeEmail,
          eventTypeId: process.env.CAL_EVENT_TYPE_ID,
        },
      });
      const msg = json?.error?.message ?? json?.message ?? `HTTP ${res.status}`;
      return { success: false, error: msg };
    }

    const data = json.data ?? json;
    return {
      success: true,
      bookingId: String(data.id ?? data.bookingId ?? ""),
      bookingUid: data.uid ?? data.bookingUid ?? data.id ?? "",
      meetingUrl: data.meetingUrl ?? data.videoCallUrl ?? undefined,
    };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Network error" };
  }
}

// ── formatSlotsForUser ─────────────────────────────────────────────────────

const MAX_SLOTS_PER_DAY = 4;

export function formatSlotsForUser(
  slotsByDate: Record<string, string[]>,
  timeZone: string = "America/Mexico_City"
): string {
  const dateFormatter = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone,
  });
  const timeFormatter = new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone,
  });

  const dates = Object.keys(slotsByDate).sort();
  if (dates.length === 0) return "No availability in that date range.";

  const lines: string[] = [];
  for (const date of dates) {
    const slots = slotsByDate[date];
    const label = dateFormatter.format(new Date(`${date}T12:00:00`));
    const capitalized = label.charAt(0).toUpperCase() + label.slice(1);

    if (!slots || slots.length === 0) {
      lines.push(`${capitalized}: no availability`);
    } else {
      const displayed = slots.slice(0, MAX_SLOTS_PER_DAY);
      const times = displayed.map((iso) => timeFormatter.format(new Date(iso))).join(", ");
      const more = slots.length > MAX_SLOTS_PER_DAY ? ` (+${slots.length - MAX_SLOTS_PER_DAY} more)` : "";
      lines.push(`${capitalized}: ${times}${more}`);
    }
  }

  return lines.join("\n");
}
