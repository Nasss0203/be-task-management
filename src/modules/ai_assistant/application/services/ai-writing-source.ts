import type { AiIntentResult } from '../ports/ai-intent.port';
import {
  foldInstruction,
  maskQuotedText,
  stripCommandPrefix,
} from './ai-instruction-evidence';

const ACTION =
  /^(?:dich|translate|tom tat|summarize|rut gon|shorten|viet lai|rewrite|improve|paraphrase|mo rong|expand|elaborate|viet tiep|continue)\b/u;
const LANGUAGES: Record<string, string[]> = {
  English: ['tieng anh', 'english'],
  Vietnamese: ['tieng viet', 'vietnamese'],
  Japanese: ['tieng nhat', 'japanese'],
  Korean: ['tieng han', 'korean'],
  French: ['tieng phap', 'french'],
  German: ['tieng duc', 'german'],
  Chinese: ['tieng trung', 'chinese'],
  Spanish: ['tieng tay ban nha', 'spanish'],
};

export function resolveWritingSource(
  instruction: string,
  selectedText: string | null | undefined,
  intent: AiIntentResult['result'],
): { text: string; language?: string } | null {
  const quotes = [
    ...instruction.matchAll(
      /"([^"]+)"|'([^']+)'|“([^”]+)”|‘([^’]+)’|`([^`]+)`/gu,
    ),
  ];
  const colonIndex =
    Array.from(instruction.matchAll(/:/gu)).find(
      (colon) =>
        !quotes.some(
          (quote) =>
            colon.index > quote.index &&
            colon.index < quote.index + quote[0].length,
        ),
    )?.index ?? -1;
  const commandSource =
    colonIndex >= 0 ? instruction.slice(0, colonIndex) : instruction;
  const masked = maskQuotedText(commandSource);
  if (masked === null) return null;
  const directive = stripCommandPrefix(foldInstruction(masked));
  // Quoted Page titles cannot become text, including with selected data present.
  if (/\b(?:trang|page)\b/u.test(directive)) return null;
  let text = selectedText ?? null;
  if (!text && ACTION.test(directive)) {
    if (colonIndex >= 0) {
      text = instruction.slice(colonIndex + 1).trim();
    } else {
      const quote = quotes.length === 1 ? quotes[0] : null;
      if (
        quote &&
        !/\b(?:sang|to)\s+(?:tieng\s+)?$/u.test(
          foldInstruction(instruction.slice(0, quote.index)),
        )
      ) {
        text =
          quote
            .slice(1)
            .find((value) => value !== undefined)
            ?.trim() ?? null;
      }
    }
  }
  if (!text?.trim()) return null;
  if (intent.writingAction !== 'TRANSLATE') return { text };
  const matched = Object.entries(LANGUAGES).filter(([, aliases]) =>
    aliases.some(
      (alias) =>
        new RegExp(`\\b(?:sang\\s+|to\\s+)${alias}\\b`, 'u').test(directive) ||
        new RegExp(`^${alias}\\s+please[.!?]*$`, 'u').test(directive),
    ),
  );
  if (matched.length !== 1 || matched[0][0] !== intent.language) return null;
  return { text, language: matched[0][0] };
}
