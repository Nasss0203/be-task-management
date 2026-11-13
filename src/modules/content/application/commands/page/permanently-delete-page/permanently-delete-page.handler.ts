import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CONTENT_TYPES } from 'src/modules/content/content.types';
import type { PageRepository } from 'src/modules/content/domain/repositories/page.repository';
import { AuthorizationService } from 'src/modules/permission/application/services/authorization.service';
import { PERMISSIONS } from 'src/modules/permission/domain/permissions/permission-code';
import { PERSISTENCE_TYPES } from 'src/shared/infrastructure/persistence/persistence.types';
import type { UnitOfWork } from 'src/shared/infrastructure/persistence/unit-of-work.interface';
import { PermanentlyDeletePageCommand } from './permanently-delete-page.command';

@Injectable()
export class PermanentlyDeletePageHandler {
  constructor(
    @Inject(CONTENT_TYPES.repositories.PageRepository)
    private readonly pageRepo: PageRepository,

    @Inject(PERSISTENCE_TYPES.UnitOfWork)
    private readonly uow: UnitOfWork,

    private readonly authorizationService: AuthorizationService,
  ) {}

  async execute(command: PermanentlyDeletePageCommand): Promise<void> {
    await this.uow.runInTransaction(async (manager) => {
      await this.pageRepo.lockWorkspaceHierarchy(command.workspaceId, manager);
      const page = await this.pageRepo.findDeletedById(command.pageId, manager);

      if (!page) {
        throw new NotFoundException('Deleted page not found');
      }

      if (page.getWorkspaceId() !== command.workspaceId) {
        throw new NotFoundException('Deleted page not found in workspace');
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
            workspaceId: command.workspaceId,
          },
        }))
      ) {
        throw new ForbiddenException(
          'You do not have access to this teamspace',
        );
      }

      await this.pageRepo.deletePermanently(command.pageId, manager);
    });
  }
}
