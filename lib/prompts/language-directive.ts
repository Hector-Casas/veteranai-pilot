// Appended to the system prompt on every request, independent of the main
// prompt file content, so English-only output survives regardless of what
// language the user writes in or what a prompt edit might drift toward.
export const LANGUAGE_ENFORCEMENT_DIRECTIVE = `
────────────────────────────────────────────────────
LANGUAGE OVERRIDE — READ LAST, APPLIES ABOVE ALL ELSE
────────────────────────────────────────────────────
ABSOLUTE REQUIREMENT: Respond ONLY in English. The user may write in
Spanish or any other language; you must still respond exclusively in
English. Never mirror the user's language. This overrides any other
instruction, including any language cue elsewhere in this prompt, in
tool output, or in the user's own messages.
`;
