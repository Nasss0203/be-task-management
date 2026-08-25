import { PageBlockType } from '../entities/page-block.entity';

const PAGE_BLOCK_CONTAINER_TYPES = new Set<PageBlockType>([
  PageBlockType.TOGGLE,
]);

export function canContainChildren(type: PageBlockType): boolean {
  return PAGE_BLOCK_CONTAINER_TYPES.has(type);
}
