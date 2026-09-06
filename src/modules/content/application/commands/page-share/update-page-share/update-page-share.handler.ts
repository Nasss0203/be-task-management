import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { CONTENT_TYPES } from 'src/modules/content/content.types';

import { AuthorizationService } from 'src/modules/permission/application/services/authorization.service';
import { PERMISSIONS } from 'src/modules/permission/domain/permissions/permission-code';

import { PERSISTENCE_TYPES } from 'src/shared/infrastructure/persistence/persistence.types';
import type { UnitOfWork } from 'src/shared/infrastructure/persistence/unit-of-work.interface';

import type { PageShareDto } from '../../../dto/page-share/page-share.dto';

import type { PageShareRepository } from '../../../../domain/repositories/page-share.repository';

import { UpdatePageShareCommand } from './update-page-share.command';

@Injectable()
export class UpdatePageShareHandler {
  constructor(
    @Inject(CONTENT_TYPES.repositories.PageShareRepository)
    private readonly pageShareRepository: PageShareRepository,

    @Inject(PERSISTENCE_TYPES.UnitOfWork)
    private readonly unitOfWork: UnitOfWork,

    private readonly authorizationService: AuthorizationService,
  ) {}

  async execute(command: UpdatePageShareCommand): Promise<PageShareDto> {
    return this.unitOfWork.runInTransaction(async (manager) => {
      // 1. Tìm PageShare
      const share = await this.pageShareRepository.findById(
        command.shareId,
        manager,
      );

      if (!share) {
        throw new NotFoundException('Page share not found');
      }

      // 2. Check quyền quản lý share trên Page
      const allowed = await this.authorizationService.authorize({
        userId: command.userId,

        permissions: [PERMISSIONS.PAGE_SHARE_UPDATE],

        target: {
          type: 'page',
          id: share.getPageId(),
        },
      });

      if (!allowed) {
        throw new ForbiddenException(
          'You do not have permission to update this page share',
        );
      }

      // 3. Domain thay đổi access level
      share.changeAccessLevel(command.accessLevel);

      // 4. Persist
      const saved = await this.pageShareRepository.save(share, manager);

      // 5. Response DTO
      return {
        id: saved.getId(),
        userId: saved.getUserId(),
        accessLevel: saved.getAccessLevel(),
        createdBy: saved.getCreatedBy(),
        createdAt: saved.getCreatedAt(),
        updatedAt: saved.getUpdatedAt(),
      };
    });
  }
}
