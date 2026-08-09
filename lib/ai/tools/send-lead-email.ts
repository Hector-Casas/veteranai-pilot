import { tool } from "ai";
import { z } from "zod";
import { getResendClient } from "@/lib/email/resend-client";
import { buildLeadNotificationEmail } from "@/lib/email/templates/lead-notification";

const inputSchema = z.object({
  name: z.string().min(2).describe("Prospect's full name"),
  email: z.string().email().describe("Prospect's email"),
  company: z.string().optional().describe("Company or organization (optional)"),
  phone: z.string().optional().describe("Contact phone number (optional)"),
  interest: z
    .string()
    .min(10)
    .describe("Description of the problem or need the prospect wants to solve"),
  urgency: z
    .enum(["alta", "media", "baja"])
    .optional()
    .describe("Perceived urgency of the project (alta=high, media=medium, baja=low)"),
  conversationSummary: z
    .string()
    .min(30)
    .describe(
      "3-5 sentence narrative paragraph summarizing how the prospect arrived, what they're looking for, and their level of interest. Written in English, neutral tone."
    ),
});

type SendLeadEmailOutput = { success: true; messageId: string } | { success: false; error: string };

export const sendLeadEmailTool = tool({
  description:
    "Sends an email notification to the Veteran AI team with the prospect's details and a conversation summary. " +
    "ONLY invoke AFTER the user has explicitly confirmed they want to be contacted " +
    "and has provided at least name, email, and a concrete interest.",
  inputSchema,
  execute: async (input): Promise<SendLeadEmailOutput> => {
    try {
      const fromEmail = process.env.RESEND_FROM_EMAIL;
      const toEmail = process.env.CONTACT_EMAIL;

      if (!fromEmail || !toEmail) {
        return {
          success: false,
          error: "Email configuration missing on the server.",
        };
      }

      const { subject, html, text } = buildLeadNotificationEmail({
        prospect: {
          name: input.name,
          email: input.email,
          company: input.company,
          phone: input.phone,
          interest: input.interest,
          urgency: input.urgency,
        },
        conversationSummary: input.conversationSummary,
        timestamp: new Date().toISOString(),
      });

      const { data, error } = await getResendClient().emails.send({
        from: fromEmail,
        to: toEmail,
        subject,
        html,
        text,
      });

      if (error || !data) {
        return { success: false, error: error?.message ?? "Unknown Resend error" };
      }

      return { success: true, messageId: data.id };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unexpected error";
      return { success: false, error: message };
    }
  },
});
