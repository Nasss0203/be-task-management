import { BadRequestException, Inject, Injectable } from '@nestjs/common';

import { CONTENT_TYPES } from 'src/modules/content/content.types';
import type { PageBlockRepository } from 'src/modules/content/domain/repositories/page-block.repository';
import type { PageRepository } from 'src/modules/content/domain/repositories/page.repository';
import { DATABASE_TYPES } from 'src/modules/database/database.types';
import type { DatabaseRepository } from 'src/modules/database/domain/repositories/database.repository';
import { AuthorizationService } from 'src/modules/permission/application/services/authorization.service';
import { PERMISSIONS } from 'src/modules/permission/constants/permission.constant';

import { ListDatabaseMentionTitlesQuery } from './list-database-mention-titles.query';

export const DATABASE_MENTION_TITLES_LIMIT = 50;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface DatabaseMentionTitleDto {
  databaseId: string;
  name: string;
  pageId: string;
}

export type DatabaseMentionTitlesDto = Record<
  string,
  DatabaseMentionTitleDto | null
>;

@Injectable()
export class ListDatabaseMentionTitlesHandler {
  constructor(
    @Inject(DATABASE_TYPES.repositories.DatabaseRepository)
    private readonly databaseRepo: DatabaseRepository,

    @Inject(CONTENT_TYPES.repositories.PageRepository)
    private readonly pageRepo: PageRepository,

    @Inject(CONTENT_TYPES.repositories.PageBlockRepository)
    private readonly pageBlockRepo: PageBlockRepository,

    private readonly authorizationService: AuthorizationService,
  ) {}

  async execute(
    query: ListDatabaseMentionTitlesQuery,
  ): Promise<DatabaseMentionTitlesDto> {
    const ids = [
      ...new Set(
        query.databaseIds
          .map((id) => id.trim().toLowerCase())
          .filter((id) => UUID.test(id)),
      ),
    ];

    if (ids.length > DATABASE_MENTION_TITLES_LIMIT) {
      throw new BadRequestException(
        `At most ${DATABASE_MENTION_TITLES_LIMIT} database ids are allowed`,
      );
    }

    const databases = (
      await Promise.all(ids.map((id) => this.databaseRepo.findById(id)))
    ).filter((database) => database !== null);

    const pageIds = [
      ...new Set(databases.map((database) => database.getPageId())),
    ];
    const viewBlocks = pageIds.length
      ? await this.pageBlockRepo.findDatabaseViewBlocksByPageIds(pageIds)
      : [];
    const liveIds = new Set(
      viewBlocks
        .filter((block) => !block.getDeletedAt())
        .map((block) => block.getReferencedDatabaseId()),
    );

    const readablePageIds = new Set(
      (
        await Promise.all(
          pageIds.map(async (pageId) =>
            (await this.canRead(pageId, query)) ? pageId : null,
          ),
        )
      ).filter((pageId) => pageId !== null),
    );

    const titles: DatabaseMentionTitlesDto = Object.fromEntries(
      ids.map((id) => [id, null]),
    );

    for (const database of databases) {
      if (
        liveIds.has(database.getId()) &&
        readablePageIds.has(database.getPageId())
      ) {
        titles[database.getId()] = {
          databaseId: database.getId(),
          name: database.getName(),
          pageId: database.getPageId(),
        };
      }
    }

    return titles;
  }

  private async canRead(
    pageId: string,
    query: ListDatabaseMentionTitlesQuery,
  ): Promise<boolean> {
    const page = await this.pageRepo.findById(pageId);

    if (
      !page ||
      page.getDeletedAt() ||
      page.getWorkspaceId() !== query.workspaceId
    ) {
      return false;
    }

    return this.authorizationService.authorize({
      userId: query.userId,
      permissions: [PERMISSIONS.PAGE_READ],
      target: { type: 'page', id: pageId },
    });
  }
}
