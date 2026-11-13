import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CONTENT_TYPES } from 'src/modules/content/content.types';
import type { PageBlockRepository } from 'src/modules/content/domain/repositories/page-block.repository';
import type { PageRepository } from 'src/modules/content/domain/repositories/page.repository';
import { DATABASE_TYPES } from 'src/modules/database/database.types';
import type { DatabaseRepository } from 'src/modules/database/domain/repositories/database.repository';
import { AuthorizationService } from 'src/modules/permission/application/services/authorization.service';
import { PERMISSIONS } from 'src/modules/permission/domain/permissions/permission-code';
import { PERSISTENCE_TYPES } from 'src/shared/infrastructure/persistence/persistence.types';
import type { UnitOfWork } from 'src/shared/infrastructure/persistence/unit-of-work.interface';
import { findTrashedDatabaseBlocks } from '../find-trashed-database-blocks';
import { PermanentlyDeletePageDatabaseCommand } from './permanently-delete-page-database.command';

@Injectable()
export class PermanentlyDeletePageDatabaseHandler {
  constructor(
    @Inject(CONTENT_TYPES.repositories.PageBlockRepository)
    private readonly pageBlockRepo: PageBlockRepository,

    @Inject(DATABASE_TYPES.repositories.DatabaseRepository)
    private readonly databaseRepo: DatabaseRepository,

    @Inject(PERSISTENCE_TYPES.UnitOfWork)
    private readonly uow: UnitOfWork,

    @Inject(CONTENT_TYPES.repositories.PageRepository)
    private readonly pageRepo: PageRepository,

    private readonly authorizationService: AuthorizationService,
  ) {}

  async execute(command: PermanentlyDeletePageDatabaseCommand): Promise<void> {
    const page = await this.pageRepo.findById(command.pageId);

    if (!page) {
      throw new NotFoundException('Page not found');
    }

    const allowed = await this.authorizationService.authorize({
      userId: command.userId,
      permissions: [PERMISSIONS.PAGE_PERMANENT_DELETE],
      target: { type: 'workspace', id: page.getWorkspaceId() },
    });

    if (!allowed) {
      throw new ForbiddenException(
        'Only workspace owners can permanently delete databases',
      );
    }

    const teamspaceId = page.getTeamspaceId();
    if (
      teamspaceId &&
      !(await this.authorizationService.authorize({
        userId: command.userId,
        permissions: [PERMISSIONS.TEAMSPACE_READ],
        target: {
          type: 'teamspace',
          id: teamspaceId,
          workspaceId: page.getWorkspaceId(),
        },
      }))
    ) {
      throw new ForbiddenException('You do not have access to this teamspace');
    }

    await this.uow.runInTransaction(async (context) => {
      const blocks = await findTrashedDatabaseBlocks(
        this.databaseRepo,
        this.pageBlockRepo,
        command.pageId,
        command.databaseId,
        context,
      );

      // DATABASE_VIEW blocks never have children, so a hard delete is safe.
      await this.pageBlockRepo.deletePermanently(
        blocks.map((block) => block.getId()),
        context,
      );

      await this.databaseRepo.delete(command.databaseId, context);
    });
  }
}
