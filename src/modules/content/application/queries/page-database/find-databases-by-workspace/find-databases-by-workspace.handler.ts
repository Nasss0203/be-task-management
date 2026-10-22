import { Inject, Injectable } from '@nestjs/common';
import { CONTENT_TYPES } from 'src/modules/content/content.types';
import type { PageBlockRepository } from 'src/modules/content/domain/repositories/page-block.repository';
import type { PageRepository } from 'src/modules/content/domain/repositories/page.repository';
import { DATABASE_TYPES } from 'src/modules/database/database.types';
import type { DatabaseRepository } from 'src/modules/database/domain/repositories/database.repository';
import { FindDatabasesByWorkspaceQuery } from './find-databases-by-workspace.query';

export interface WorkspaceDatabaseResponse {
  id: string;
  pageId: string;
  name: string;
  deletedAt: Date | null;
}

@Injectable()
export class FindDatabasesByWorkspaceHandler {
  constructor(
    @Inject(CONTENT_TYPES.repositories.PageRepository)
    private readonly pageRepo: PageRepository,

    @Inject(CONTENT_TYPES.repositories.PageBlockRepository)
    private readonly pageBlockRepo: PageBlockRepository,

    @Inject(DATABASE_TYPES.repositories.DatabaseRepository)
    private readonly databaseRepo: DatabaseRepository,
  ) {}

  async execute(
    query: FindDatabasesByWorkspaceQuery,
  ): Promise<WorkspaceDatabaseResponse[]> {
    // Only databases on pages the user can already see in the sidebar.
    const pages = await this.pageRepo.findAccessibleByWorkspace(
      query.workspaceId,
      query.userId,
    );
    const pageIds = pages.map((page) => page.getId());

    const [databases, blocks] = await Promise.all([
      this.databaseRepo.findByPageIds(pageIds),
      this.pageBlockRepo.findDatabaseViewBlocksByPageIds(pageIds),
    ]);

    // A database is live while any block shows it; otherwise it sits in Trash.
    const liveIds = new Set<string>();
    const deletedAtById = new Map<string, Date>();

    for (const block of blocks) {
      const databaseId = block.getReferencedDatabaseId();
      const deletedAt = block.getDeletedAt();

      if (!databaseId) {
        continue;
      }

      if (!deletedAt) {
        liveIds.add(databaseId);
      } else if (!deletedAtById.has(databaseId)) {
        // Blocks arrive latest-deleted first.
        deletedAtById.set(databaseId, deletedAt);
      }
    }

    const result = databases
      .filter((database) =>
        query.trashed
          ? !liveIds.has(database.getId()) &&
            deletedAtById.has(database.getId())
          : liveIds.has(database.getId()),
      )
      .map((database) => ({
        id: database.getId(),
        pageId: database.getPageId(),
        name: database.getName(),
        deletedAt: query.trashed ? deletedAtById.get(database.getId())! : null,
      }));

    if (query.trashed) {
      result.sort((a, b) => b.deletedAt!.getTime() - a.deletedAt!.getTime());
    }

    return result;
  }
}
