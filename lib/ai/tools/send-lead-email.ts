import { tool } from "ai";
import { z } from "zod";
import { resend } from "@/lib/email/resend-client";
import { buildLeadNotificationEmail } from "@/lib/email/templates/lead-notification";

const inputSchema = z.object({
  name: z.string().min(2).describe("Nombre completo del prospecto"),
  email: z.string().email().describe("Email del prospecto"),
  company: z.string().optional().describe("Empresa u organización (opcional)"),
  phone: z.string().optional().describe("Teléfono de contacto (opcional)"),
  interest: z
    .string()
    .min(10)
    .describe("Descripción del problema o necesidad que el prospecto quiere resolver"),
  urgency: z
    .enum(["alta", "media", "baja"])
    .optional()
    .describe("Urgencia percibida del proyecto"),
  conversationSummary: z
    .string()
    .min(30)
    .describe(
      "Párrafo narrativo de 3-5 oraciones resumiendo cómo llegó el prospecto, qué busca y su nivel de interés. Escrito en español, tono neutro."
    ),
});

type SendLeadEmailOutput = { success: true; messageId: string } | { success: false; error: string };

export const sendLeadEmailTool = tool({
  description:
    "Envía una notificación por email al equipo de Veteran AI con los datos del prospecto y un resumen de la conversación. " +
    "SOLO invocar DESPUÉS de que el usuario haya confirmado explícitamente que quiere ser contactado " +
    "y haya proporcionado al menos nombre, email e interés concreto.",
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

      const { data, error } = await resend.emails.send({
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
