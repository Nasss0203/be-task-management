const TITLE_LIMIT = 70;

/**
 * Use the first user request as a readable title for legacy conversations
 * whose stored title is the original generic placeholder.
 */
export function toAiConversationTitle(content: string): string | null {
  const normalized = content.replace(/\s+/gu, ' ').trim();
  if (!normalized) return null;

  const characters = Array.from(normalized);
  if (characters.length <= TITLE_LIMIT) return normalized;

  return `${characters.slice(0, TITLE_LIMIT - 1).join('').trimEnd()}…`;
}
