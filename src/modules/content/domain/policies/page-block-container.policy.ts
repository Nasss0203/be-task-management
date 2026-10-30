import { BadRequestException } from '@nestjs/common';
import type { PageBlockStyleConfig } from 'src/shared/domain/page-block.types';
import { PageBlockType } from 'src/shared/domain/page-block-type.enum';

const PAGE_BLOCK_CONTAINER_TYPES = new Set<PageBlockType>([
  PageBlockType.TOGGLE,
  PageBlockType.COLUMN_LIST,
  PageBlockType.COLUMN,
  PageBlockType.SECTION,
]);

export const SECTION_TONES = [
  'default',
  'info',
  'success',
  'warning',
  'danger',
] as const;

export const MIN_COLUMNS = 2;
export const MAX_COLUMNS = 5;
const MIN_COLUMN_WIDTH_RATIO = 0.1;
const MAX_COLUMN_WIDTH_RATIO = 0.9;

export function canContainChildren(type: PageBlockType): boolean {
  return PAGE_BLOCK_CONTAINER_TYPES.has(type);
}

/**
 * Whether a block of `childType` may sit directly under `parentType`
 * (null = the root of a page or task content):
 * a column row holds only columns, a column never sits anywhere else,
 * and a column never holds another column row.
 */
export function canContain(
  parentType: PageBlockType | null,
  childType: PageBlockType,
): boolean {
  if (parentType === PageBlockType.COLUMN_LIST) {
    return childType === PageBlockType.COLUMN;
  }

  if (childType === PageBlockType.COLUMN) {
    return false;
  }

  if (childType === PageBlockType.FORM_FIELD) {
    return parentType === PageBlockType.SECTION;
  }

  if (parentType === null) {
    return true;
  }

  if (parentType === PageBlockType.COLUMN) {
    return childType !== PageBlockType.COLUMN_LIST;
  }

  if (parentType === PageBlockType.SECTION) {
    return childType !== PageBlockType.SECTION;
  }

  return canContainChildren(parentType);
}

export function assertCanContain(
  parentType: PageBlockType | null,
  childType: PageBlockType,
): void {
  if (!canContain(parentType, childType)) {
    throw new BadRequestException(
      `Block type ${childType} cannot be placed in ${parentType ?? 'the page root'}`,
    );
  }
}

export function assertValidLayoutStyle(
  type: PageBlockType,
  styleConfig: PageBlockStyleConfig | undefined,
): void {
  if (!styleConfig) {
    return;
  }

  if (type === PageBlockType.SECTION) {
    const tone = styleConfig.tone;

    if (
      tone !== undefined &&
      !SECTION_TONES.includes(tone as (typeof SECTION_TONES)[number])
    ) {
      throw new BadRequestException(
        `tone must be one of ${SECTION_TONES.join(', ')}`,
      );
    }

    return;
  }

  if (type !== PageBlockType.COLUMN) {
    return;
  }

  const ratio = styleConfig.width_ratio;

  if (
    ratio !== undefined &&
    (typeof ratio !== 'number' ||
      !Number.isFinite(ratio) ||
      ratio < MIN_COLUMN_WIDTH_RATIO ||
      ratio > MAX_COLUMN_WIDTH_RATIO)
  ) {
    throw new BadRequestException(
      'width_ratio must be a number between 0.1 and 0.9',
    );
  }
}
