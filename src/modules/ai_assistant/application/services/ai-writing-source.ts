import type { AiIntentResult } from '../ports/ai-intent.port';
import {
  foldInstruction,
  maskQuotedText,
  stripCommandPrefix,
} from './ai-instruction-evidence';
import { normalizeCommand } from './ai-sentence-normalize';
import { inlineWritingText } from './ai-writing-inline-text';
import { vocabularyPattern } from './ai-vi-vocabulary-words';

const ACTION = new RegExp(
  `^(?:${vocabularyPattern('write_translate', 'write_improve', 'write_shorten', 'write_expand', 'write_summarize', 'write_continue')})\\b`,
  'u',
);
const DRAFT_REQUEST = new RegExp(
  `^(?:ban\\s+)?${vocabularyPattern('write_draft_verb')}\\b(?:\\s+\\S+){0,4}?\\s+${vocabularyPattern('write_draft_kind')}\\b`,
  'u',
);
const LANGUAGE_BEFORE = vocabularyPattern('language_prep', 'language_noun');
const PAGE_WORD = /\b(?:trang(?!\s+trong(?:\s+hon\b|\s*(?:[,.!?]|$)))|page)\b/u;
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
  if (PAGE_WORD.test(directive)) return null;
  if (intent.writingAction === 'DRAFT')
    return draftSource(instruction, directive, intent.language);
  let text = selectedText ?? null;
  // V1: "bạn có thể dịch giúp tôi …" leads with the verb once polite words go.
  if (!text && ACTION.test(normalizeCommand(directive))) {
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
  // V2: no ":", no quotes — the words left after verb, filler and language.
  if (!text && colonIndex < 0 && quotes.length === 0)
    text = inlineWritingText(instruction);
  if (!text?.trim()) return null;
  if (intent.writingAction !== 'TRANSLATE') return { text };
  const matched = namedTargets(directive);
  if (matched.length !== 1 || matched[0] !== intent.language) return null;
  return { text, language: matched[0] };
}

function namedTargets(directive: string): string[] {
  return Object.entries(LANGUAGES)
    .filter(([, aliases]) =>
      aliases.some(
        (alias) =>
          new RegExp(`\\b${LANGUAGE_BEFORE}\\s+${alias}\\b`, 'u').test(
            directive,
          ) || new RegExp(`^${alias}\\s+please[.!?]*$`, 'u').test(directive),
      ),
    )
    .map(([name]) => name);
}

function namedLanguages(directive: string): string[] {
  return Object.entries(LANGUAGES)
    .filter(([, aliases]) =>
      aliases.some((alias) =>
        new RegExp(`\\b${alias}\\b`, 'u').test(directive),
      ),
    )
    .map(([name]) => name);
}

function draftSource(
  instruction: string,
  directive: string,
  language: string | null,
): { text: string; language?: string } | null {
  if (!DRAFT_REQUEST.test(normalizeCommand(directive))) return null;
  if (language === null) return { text: instruction };
  const targets = namedTargets(directive);
  const named = targets.length ? targets : namedLanguages(directive);
  if (named.length !== 1 || named[0] !== language) return null;
  return { text: instruction, language };
}
