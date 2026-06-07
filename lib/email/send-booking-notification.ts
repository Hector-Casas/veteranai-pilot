import { getResendClient } from "./resend-client";
import { buildBookingNotificationEmail } from "./templates/booking-notification";

type BookingNotifInput = Parameters<typeof buildBookingNotificationEmail>[0];

export async function sendBookingNotificationEmail(
  data: BookingNotifInput
): Promise<{ success: boolean; error?: string }> {
  const fromEmail = process.env.RESEND_FROM_EMAIL;
  const toEmail = process.env.CONTACT_EMAIL;

  if (!fromEmail || !toEmail) {
    const msg = "RESEND_FROM_EMAIL or CONTACT_EMAIL not configured";
    console.error("[sendBookingNotificationEmail]", msg);
    return { success: false, error: msg };
  }

  try {
    const { subject, html, text } = buildBookingNotificationEmail(data);
    const { error } = await getResendClient().emails.send({ from: fromEmail, to: toEmail, subject, html, text });
    if (error) {
      console.error("[sendBookingNotificationEmail] Resend error:", error.message);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unexpected error";
    console.error("[sendBookingNotificationEmail]", msg);
    return { success: false, error: msg };
  }
}
