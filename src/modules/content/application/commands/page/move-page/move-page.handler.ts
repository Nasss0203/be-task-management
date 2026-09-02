import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { CONTENT_TYPES } from 'src/modules/content/content.types';
import type { PageRepository } from 'src/modules/content/domain/repositories/page.repository';

import { AuthorizationService } from 'src/modules/permission/application/services/authorization.service';
import type { AuthorizationTarget } from 'src/modules/permission/application/types/authorization-target';
import { PERMISSIONS } from 'src/modules/permission/domain/permissions/permission-code';

import { PERSISTENCE_TYPES } from 'src/shared/infrastructure/persistence/persistence.types';
import type { UnitOfWork } from 'src/shared/infrastructure/persistence/unit-of-work.interface';

import { MovePageCommand } from './move-page.command';

@Injectable()
export class MovePageHandler {
  constructor(
    @Inject(CONTENT_TYPES.repositories.PageRepository)
    private readonly pageRepo: PageRepository,

    @Inject(PERSISTENCE_TYPES.UnitOfWork)
    private readonly uow: UnitOfWork,

    private readonly authorizationService: AuthorizationService,
  ) {}

  async execute(command: MovePageCommand): Promise<void> {
    await this.uow.runInTransaction(async (manager) => {
      /**
       * 1. Find Page cần move.
       */
      const page = await this.pageRepo.findById(command.pageId, manager);

      if (!page) {
        throw new NotFoundException('Page not found');
      }

      /**
       * 2. Page phải thuộc Workspace hiện tại.
       */
      if (page.getWorkspaceId() !== command.workspaceId) {
        throw new NotFoundException('Page not found in workspace');
      }

      /**
       * 3. User phải có quyền update Page nguồn.
       */
      const canUpdateSource = await this.authorizationService.authorize({
        userId: command.userId,

        target: {
          type: 'page',
          id: command.pageId,
        },

        permissions: [PERMISSIONS.PAGE_UPDATE],
      });

      if (!canUpdateSource) {
        throw new ForbiddenException(
          'You do not have permission to move this page',
        );
      }

      /**
       * 4. Không được move vào chính nó.
       */
      if (command.parentPageId === command.pageId) {
        throw new BadRequestException('Page cannot be moved into itself');
      }

      let targetParentPageId: string | null = null;

      let targetTeamspaceId: string | null = command.teamspaceId;

      let destinationTarget: AuthorizationTarget;

      /**
       * 5. Move vào một Parent Page.
       */
      if (command.parentPageId) {
        const parent = await this.pageRepo.findById(
          command.parentPageId,
          manager,
        );

        if (!parent) {
          throw new NotFoundException('Target parent page not found');
        }

        /**
         * Parent phải cùng Workspace.
         */
        if (parent.getWorkspaceId() !== command.workspaceId) {
          throw new BadRequestException(
            'Target parent page belongs to another workspace',
          );
        }

        /**
         * Check cycle.
         *
         * A
         * └── B
         *     └── C
         *
         * Không cho:
         *
         * A -> B
         * A -> C
         * B -> C
         */
        let cursor = parent;

        while (cursor) {
          if (cursor.getId() === command.pageId) {
            throw new BadRequestException(
              'Page cannot be moved into its descendant',
            );
          }

          const parentId = cursor.getParentPageId();

          if (!parentId) {
            break;
          }

          const nextParent = await this.pageRepo.findById(parentId, manager);

          if (!nextParent) {
            break;
          }

          cursor = nextParent;
        }

        /**
         * Destination Parent.
         */
        targetParentPageId = parent.getId();

        /**
         * Child luôn inherit Teamspace từ Parent.
         *
         * Không tin teamspaceId client gửi lên
         * khi parentPageId != null.
         */
        targetTeamspaceId = parent.getTeamspaceId();

        /**
         * Authorization destination.
         */
        destinationTarget = targetTeamspaceId
          ? {
              type: 'teamspace',
              id: targetTeamspaceId,
              workspaceId: command.workspaceId,
            }
          : {
              type: 'workspace',
              id: command.workspaceId,
            };
      } else {
        /**
         * 6. Move thành root Page.
         *
         * teamspaceId = null
         * => Private root
         *
         * teamspaceId != null
         * => Teamspace root
         */
        targetParentPageId = null;

        targetTeamspaceId = command.teamspaceId;

        destinationTarget = targetTeamspaceId
          ? {
              type: 'teamspace',
              id: targetTeamspaceId,
              workspaceId: command.workspaceId,
            }
          : {
              type: 'workspace',
              id: command.workspaceId,
            };
      }

      /**
       * 7. User phải có quyền tạo/add Page
       * tại destination.
       */
      const canCreateAtDestination = await this.authorizationService.authorize({
        userId: command.userId,

        target: destinationTarget,

        permissions: [PERMISSIONS.PAGE_CREATE],
      });

      if (!canCreateAtDestination) {
        throw new ForbiddenException(
          'You do not have permission to move the page to this destination',
        );
      }

      /**
       * 8. Move Page + toàn bộ descendants.
       */
      await this.pageRepo.moveHierarchy(
        command.pageId,
        targetParentPageId,
        targetTeamspaceId,
        manager,
      );
    });
  }
}
