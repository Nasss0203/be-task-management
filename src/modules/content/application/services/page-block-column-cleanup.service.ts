import { Inject, Injectable } from '@nestjs/common';
import { CONTENT_TYPES } from 'src/modules/content/content.types';
import type { PageBlock } from 'src/modules/content/domain/entities/page-block.entity';
import type { PageBlockRepository } from 'src/modules/content/domain/repositories/page-block.repository';
import { PageBlockType } from 'src/shared/domain/page-block-type.enum';
import type { PersistenceContext } from 'src/shared/infrastructure/persistence/persistence-context';
import { PageBlockOrderingService } from './page-block-ordering.service';

/**
 * Keeps column rows valid after a block leaves them (moved out or deleted):
 * an empty column goes away, and a row left with one column is unwrapped so
 * its blocks sit back where the row was.
 */
@Injectable()
export class PageBlockColumnCleanupService {
  constructor(
    @Inject(CONTENT_TYPES.repositories.PageBlockRepository)
    private readonly pageBlockRepo: PageBlockRepository,
    private readonly ordering: PageBlockOrderingService,
  ) {}

  /** Call with the id of the parent a block just left. */
  async tidy(
    parentBlockId: string | null,
    userId: string,
    context?: PersistenceContext,
  ): Promise<void> {
    if (!parentBlockId) return;

    const parent = await this.pageBlockRepo.findById(parentBlockId, context);
    if (!parent) return;

    if (parent.getType() === PageBlockType.COLUMN) {
      const children = await this.pageBlockRepo.findActiveChildren(
        parent.getId(),
        context,
      );
      if (children.length > 0) return;

      parent.markAsDeleted(userId);
      await this.pageBlockRepo.save(parent, context);
      await this.tidy(parent.getParentBlockId(), userId, context);
      return;
    }

    if (parent.getType() !== PageBlockType.COLUMN_LIST) return;

    const columns = await this.pageBlockRepo.findActiveChildren(
      parent.getId(),
      context,
    );
    if (columns.length >= 2) return;

    await this.unwrap(parent, columns[0] ?? null, userId, context);
  }

  /** Replaces the row by the blocks of its last column, at the row's place. */
  private async unwrap(
    row: PageBlock,
    lastColumn: PageBlock | null,
    userId: string,
    context?: PersistenceContext,
  ): Promise<void> {
    const moved = lastColumn
      ? await this.pageBlockRepo.findActiveChildren(lastColumn.getId(), context)
      : [];
    const siblings = await this.pageBlockRepo.findActiveSiblings(
      row.getPageId(),
      row.getRowId(),
      row.getParentBlockId(),
      context,
    );

    // Park the moved blocks past every sibling first, so no order_index collides.
    let parked = this.ordering.nextTemporaryOrder([...siblings, ...moved]);
    for (const block of moved) {
      block.moveToParent(row.getParentBlockId());
      block.changeOrder(parked++);
    }
    await this.pageBlockRepo.saveMany(moved, context);

    const emptied = lastColumn ? [lastColumn, row] : [row];
    emptied.forEach((block) => block.markAsDeleted(userId));
    await this.pageBlockRepo.saveMany(emptied, context);

    const index = siblings.findIndex((block) => block.getId() === row.getId());
    const others = siblings.filter((block) => block.getId() !== row.getId());
    await this.ordering.persistSequentialBlockOrder(
      [...others.slice(0, index), ...moved, ...others.slice(index)],
      context,
    );
  }
}
