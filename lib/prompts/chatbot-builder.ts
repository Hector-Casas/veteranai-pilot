export type IndustryKey = "restaurant" | "sales" | "clinic" | "ecommerce" | "realty";

export type Industry = {
  key: IndustryKey;
  persona: string;
  capabilities: string[];
};

export const CATALOG: Record<IndustryKey, Industry> = {
  restaurant: {
    key: "restaurant",
    persona: "Bella Vista Bistro",
    capabilities: [
      "Take orders (takeout / delivery)",
      "Make table reservations",
      "Answer menu and allergen questions",
      "Hours and location",
      "Daily specials and promos",
    ],
  },
  sales: {
    key: "sales",
    persona: "Nexus Software",
    capabilities: [
      "Qualify leads",
      "Explain plans and pricing",
      "Schedule a demo",
      "Handle common objections",
      "Compare vs competitors",
    ],
  },
  clinic: {
    key: "clinic",
    persona: "Wellness Medical Center",
    capabilities: [
      "Book appointments",
      "Answer service questions",
      "Pre-visit instructions",
      "Hours and accepted insurance",
      "Basic triage guidance",
    ],
  },
  ecommerce: {
    key: "ecommerce",
    persona: "Urban Threads",
    capabilities: [
      "Order and shipping status",
      "Product recommendations",
      "Returns and exchanges",
      "Size guidance",
      "Process a return",
    ],
  },
  realty: {
    key: "realty",
    persona: "Summit Realty",
    capabilities: [
      "Search properties by criteria",
      "Schedule viewings",
      "Financing and mortgage info",
      "Rental / purchase requirements",
      "Qualify the buyer",
    ],
  },
};

// Human-readable "kind of business" phrase for the prompt's opening line
// (e.g. "You are the assistant for Bella Vista Bistro, a restaurant.").
// Kept separate from the Industry type, which stays exactly
// { key, persona, capabilities } per the catalog's public shape.
const INDUSTRY_DESCRIPTIONS: Record<IndustryKey, string> = {
  restaurant: "a restaurant",
  sales: "a B2B software company",
  clinic: "a medical clinic",
  ecommerce: "an online clothing retailer",
  realty: "a real estate agency",
};

// ── UI-only catalog data ────────────────────────────────────────────────
// Everything below is display data for the builder UI (Delivery 2). It's
// additive to the backend catalog above — the API route never imports it —
// kept in this same file because chatbot-builder.ts has zero server-only
// dependencies and is therefore already safe to import directly from a
// client component, so there's no need for a second "client-safe" module
// that would just duplicate CATALOG.

// Short human-readable label per industry, for the Phase 1 selection cards.
export const INDUSTRY_LABELS: Record<IndustryKey, string> = {
  restaurant: "Restaurant",
  sales: "B2B Sales",
  clinic: "Medical Clinic",
  ecommerce: "E-commerce",
  realty: "Real Estate",
};

// One in-character greeting per industry, shown at the top of the generated
// chat panel. Display-only — the model never sees this string; the actual
// first model reply is only generated once the visitor sends a message.
export const INDUSTRY_GREETINGS: Record<IndustryKey, string> = {
  restaurant:
    "Welcome to Bella Vista Bistro! I can help with takeout orders, table reservations, menu questions, and more. What can I do for you today?",
  sales:
    "Hi there! I'm here to help you learn about Nexus Software — pricing, a live demo, how we stack up against alternatives, and more. What would you like to know?",
  clinic:
    "Hello! I'm the virtual assistant for Wellness Medical Center. I can help you book an appointment, answer questions about our services, or get you ready for your visit. How can I help?",
  ecommerce:
    "Hey! Welcome to Urban Threads. I can help with order status, sizing, returns, and finding the right piece for you. What are you looking for?",
  realty:
    "Welcome to Summit Realty! I can help you search for properties, schedule a viewing, or answer questions about financing. What are you looking for today?",
};

// One natural example user-prompt per capability label, across all 5
// industries — used to render the suggested-prompt chips in Phase 3. Only
// entries matching a SELECTED capability are ever shown, so the bot never
// receives a prompt for a capability it wasn't given.
export const CAPABILITY_EXAMPLE_PROMPTS: Record<string, string> = {
  // restaurant
  "Take orders (takeout / delivery)": "I'd like to place a takeout order",
  "Make table reservations": "I'd like to book a table for Friday at 8pm",
  "Answer menu and allergen questions": "Do you have any gluten-free options?",
  "Hours and location": "What are your hours today?",
  "Daily specials and promos": "What's today's special?",
  // sales
  "Qualify leads": "We're a 50-person team looking for a solution like this",
  "Explain plans and pricing": "What plans do you offer and how much do they cost?",
  "Schedule a demo": "Can I schedule a demo of your product?",
  "Handle common objections": "This seems expensive compared to what we use now",
  "Compare vs competitors": "How are you different from your competitors?",
  // clinic
  "Book appointments": "I'd like to book an appointment for next week",
  "Answer service questions": "Do you offer annual physical exams?",
  "Pre-visit instructions": "What should I do to prepare for my visit?",
  "Hours and accepted insurance": "Do you accept Blue Cross insurance?",
  "Basic triage guidance": "I have a mild fever, should I come in?",
  // ecommerce
  "Order and shipping status": "Where's my order? It hasn't arrived yet",
  "Product recommendations": "Can you recommend a jacket for cold weather?",
  "Returns and exchanges": "What's your return policy?",
  "Size guidance": "I'm not sure what size to order, can you help?",
  "Process a return": "I'd like to return an item I bought last week",
  // realty
  "Search properties by criteria": "I'm looking for a 3-bedroom house under $500k",
  "Schedule viewings": "Can I schedule a viewing for this weekend?",
  "Financing and mortgage info": "What financing options are available?",
  "Rental / purchase requirements": "What do I need to qualify to rent an apartment?",
  "Qualify the buyer": "I'm pre-approved for a mortgage, what's next?",
};

export function buildGeneratedChatbotPrompt(
  industryKey: IndustryKey,
  selectedCapabilities: string[]
): string {
  const industry = CATALOG[industryKey];
  if (!industry) {
    throw new Error(`Invalid industryKey: "${industryKey}"`);
  }
  if (selectedCapabilities.length === 0) {
    throw new Error("selectedCapabilities must not be empty");
  }

  const capabilityList = selectedCapabilities.map((c) => `- ${c}`).join("\n");

  return `You are the virtual assistant for ${industry.persona}, ${INDUSTRY_DESCRIPTIONS[industryKey]}.

## Your Role
This is an interactive product demo showing a website visitor how an AI assistant like this could work for a real business in this industry. Stay fully in character as ${industry.persona}'s assistant for the entire conversation — friendly, professional, and natural, the way a real customer-facing assistant for this kind of business would sound.

## Language
Respond ONLY in English, always. The user may write in Spanish or any other language; you must still respond exclusively in English. Never mirror the user's language. This overrides any other instruction, including any language cue in the user's own messages.

## What You Can Help With
You can help with exactly the following, and nothing else:
${capabilityList}

If the user asks for something outside this list, briefly and politely explain that's outside what this demo assistant handles, and redirect them to one of the capabilities above.

## SIMULATION HONESTY RULE — CRITICAL
This is a DEMO. You do not have access to any real database, calendar, payment processor, or order system. You may converse naturally AS IF you were performing these actions (taking an order, booking a table, checking availability, processing a return), but you must NEVER claim to have actually saved, persisted, or processed anything in a real system, and NEVER invent a real-looking confirmation number, order ID, or booking reference as if it were genuine. Keep a natural, in-character demo tone — don't break character to announce "this is a demo" on every message, but never claim real persistence either.

Examples of the RIGHT framing:
- "I'd have your table for 4 booked for Friday at 8 PM — here's what that confirmation would look like: Reservation for 4, Fri 8:00 PM, ${industry.persona}."
- "Here's how I'd process that return: a prepaid label would be emailed to you within a few minutes, and your refund would show up in 3-5 business days once it's on its way back to us."

Examples of the WRONG framing (never do this):
- "Your reservation is confirmed! Confirmation #48213 has been saved to our system."
- "I've processed your return and issued a refund to your card ending in 4242."

## Tone and Style
- Professional yet warm, matching a real ${INDUSTRY_DESCRIPTIONS[industryKey]}
- Concise: a few sentences per response, not long essays
- Natural and conversational — you're demonstrating what a real deployment would feel like
`;
}
