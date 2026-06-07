import { Resend } from "resend";

if (!process.env.RESEND_API_KEY) {
  throw new Error(
    "[Veteran AI] RESEND_API_KEY is not set. Add it to .env.local before starting the server."
  );
}

export const resend = new Resend(process.env.RESEND_API_KEY);
