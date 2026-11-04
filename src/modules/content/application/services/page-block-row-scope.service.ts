import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DATABASE_TYPES } from 'src/modules/database/database.types';
import type { DatabaseRowRepository } from 'src/modules/database/domain/repositories/database-row.repository';
import type { DatabaseRepository } from 'src/modules/database/domain/repositories/database.repository';
import { PageBlockType } from 'src/shared/domain/page-block-type.enum';
import type { PersistenceContext } from 'src/shared/infrastructure/persistence/persistence-context';

/**
 * A task's content lives on the page that holds its database, so permission
 * checks on that page cover it. This guards the link between the two.
 */
@Injectable()
export class PageBlockRowScopeService {
  constructor(
    @Inject(DATABASE_TYPES.repositories.DatabaseRowRepository)
    private readonly databaseRowRepository: DatabaseRowRepository,

    @Inject(DATABASE_TYPES.repositories.DatabaseRepository)
    private readonly databaseRepository: DatabaseRepository,
  ) {}

  /** Throws unless `rowId` is a task of a database on page `pageId`. */
  async assertRowOnPage(
    rowId: string,
    pageId: string,
    context?: PersistenceContext,
  ): Promise<void> {
    const row = await this.databaseRowRepository.findById(rowId, context);

    if (!row) {
      throw new NotFoundException('Database row not found');
    }

    const database = await this.databaseRepository.findById(
      row.getDatabaseId(),
      context,
    );

    if (database?.getPageId() !== pageId) {
      throw new BadRequestException(
        'Database row belongs to a database on another page',
      );
    }
  }

  /** No database inside a task's content, so databases never nest. */
  assertTypeAllowed(rowId: string | null, type: PageBlockType): void {
    if (rowId !== null && type === PageBlockType.DATABASE_VIEW) {
      throw new BadRequestException('A task cannot contain a database view');
    }
  }
}
