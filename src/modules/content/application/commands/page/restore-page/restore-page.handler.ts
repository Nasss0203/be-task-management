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
import { RestorePageCommand } from './restore-page.command';
import type { PageActivityRecorder } from 'src/modules/content/application/ports/page-activity-recorder.port';

@Injectable()
export class RestorePageHandler {
  constructor(
    @Inject(CONTENT_TYPES.repositories.PageRepository)
    private readonly pageRepo: PageRepository,

    @Inject(PERSISTENCE_TYPES.UnitOfWork)
    private readonly uow: UnitOfWork,
    @Inject(CONTENT_TYPES.ports.PageActivityRecorder)
    private readonly activity: PageActivityRecorder,
    private readonly authorizationService: AuthorizationService,
  ) {}

  async execute(command: RestorePageCommand): Promise<void> {
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
      const allowed = await this.authorizationService.authorize({
        userId: command.userId,
        permissions: [PERMISSIONS.PAGE_DELETE],
        target: teamspaceId
          ? {
              type: 'teamspace',
              id: teamspaceId,
              workspaceId: command.workspaceId,
            }
          : { type: 'workspace', id: command.workspaceId },
      });

      if (!allowed) {
        throw new ForbiddenException(
          'You do not have permission to restore this page',
        );
      }

      await this.pageRepo.restoreHierarchy(command.pageId, manager);
      await this.activity.record(
        {
          actorId: command.userId,
          pageId: command.pageId,
          action: 'PAGE_RESTORED',
        },
        manager,
      );
    });
  }
}
