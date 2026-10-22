import { BadRequestException, NotFoundException } from '@nestjs/common';
import type { PageBlock } from 'src/modules/content/domain/entities/page-block.entity';
import type { PageBlockRepository } from 'src/modules/content/domain/repositories/page-block.repository';
import type { DatabaseRepository } from 'src/modules/database/domain/repositories/database.repository';
import type { PersistenceContext } from 'src/shared/domain/persistence-context';

/**
 * Returns the deleted blocks of a trashed database, latest-deleted first.
 * Throws when the database is not on the page or still shown by a live block.
 */
export async function findTrashedDatabaseBlocks(
  databaseRepo: DatabaseRepository,
  pageBlockRepo: PageBlockRepository,
  pageId: string,
  databaseId: string,
  context: PersistenceContext,
): Promise<PageBlock[]> {
  const database = await databaseRepo.findById(databaseId, context);

  if (!database || database.getPageId() !== pageId) {
    throw new NotFoundException('Database not found');
  }

  const blocks = (
    await pageBlockRepo.findDatabaseViewBlocksByPageIds([pageId], context)
  ).filter((block) => block.getReferencedDatabaseId() === databaseId);

  if (
    blocks.length === 0 ||
    blocks.some((block) => block.getDeletedAt() === null)
  ) {
    throw new BadRequestException('Database is not in trash');
  }

  return blocks;
}
