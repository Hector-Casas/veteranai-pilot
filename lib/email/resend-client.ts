import { Resend } from "resend";

let _client: Resend | null = null;

export function getResendClient(): Resend {
  if (_client) return _client;

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error(
      "[Veteran AI] RESEND_API_KEY is not set. Add it to .env.local before starting the server."
    );
  }

  _client = new Resend(apiKey);
  return _client;
}
