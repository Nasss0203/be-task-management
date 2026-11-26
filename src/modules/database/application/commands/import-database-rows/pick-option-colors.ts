import {
  DEFAULT_PRIORITY_OPTIONS,
  DEFAULT_STATUS_OPTIONS,
} from '../../../domain/constants/default-property-options.constant';
import { OPTION_COLOR_PALETTE } from '../../../domain/constants/option-color-palette.constant';

const normalize = (value: string) => value.trim().toLowerCase();

const KNOWN_OPTION_COLORS = new Map<string, string>(
  [...DEFAULT_STATUS_OPTIONS, ...DEFAULT_PRIORITY_OPTIONS].map((option) => [
    normalize(option.name),
    option.color,
  ]),
);

export function pickOptionColors(
  existingColors: (string | null)[],
  names: string[],
): string[] {
  const knownColors = names.map(
    (name) => KNOWN_OPTION_COLORS.get(normalize(name)) ?? null,
  );
  const used = new Set(
    [...existingColors, ...knownColors].flatMap((color) =>
      color ? [color.toUpperCase()] : [],
    ),
  );
  let wrapped = 0;

  return names.map((_, index) => {
    const known = knownColors[index];
    if (known) return known;

    const color =
      OPTION_COLOR_PALETTE.find((candidate) => !used.has(candidate)) ??
      OPTION_COLOR_PALETTE[wrapped++ % OPTION_COLOR_PALETTE.length];
    used.add(color);
    return color;
  });
}
