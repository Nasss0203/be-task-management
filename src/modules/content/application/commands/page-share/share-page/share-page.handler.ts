import {
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { CONTENT_TYPES } from 'src/modules/content/content.types';

import type { PageShareRepository } from '../../../../domain/repositories/page-share.repository';
import type { PageRepository } from '../../../../domain/repositories/page.repository';

import { PageShare } from '../../../../domain/entities/page-share.entity';

import { PERSISTENCE_TYPES } from 'src/shared/infrastructure/persistence/persistence.types';

import { AuthorizationService } from 'src/modules/permission/application/services/authorization.service';
import { PERMISSIONS } from 'src/modules/permission/constants/permission.constant';

import { type UnitOfWork } from 'src/shared/infrastructure/persistence/unit-of-work.interface';
import { PageShareDto } from '../../../dto/page-share/page-share.dto';
import { SharePageCommand } from './share-page.command';

@Injectable()
export class SharePageHandler {
  constructor(
    @Inject(CONTENT_TYPES.repositories.PageRepository)
    private readonly pageRepo: PageRepository,

    @Inject(CONTENT_TYPES.repositories.PageShareRepository)
    private readonly pageShareRepo: PageShareRepository,

    @Inject(PERSISTENCE_TYPES.UnitOfWork)
    private readonly uow: UnitOfWork,

    private readonly authorizationService: AuthorizationService,
  ) {}

  async execute(command: SharePageCommand): Promise<PageShareDto> {
    if (command.userId === command.targetUserId) {
      throw new ConflictException('You cannot share a page with yourself');
    }

    const allowed = await this.authorizationService.authorize({
      userId: command.userId,
      permissions: [PERMISSIONS.PAGE_SHARE_READ],
      target: {
        type: 'page',
        id: command.pageId,
      },
    });

    if (!allowed) {
      throw new ForbiddenException(
        'You do not have permission to share this page',
      );
    }

    return this.uow.runInTransaction(async (manager) => {
      const page = await this.pageRepo.findById(command.pageId, manager);

      if (!page) {
        throw new NotFoundException('Page not found');
      }

      const existing = await this.pageShareRepo.findByPageAndUser(
        command.pageId,
        command.targetUserId,
        manager,
      );

      if (existing) {
        throw new ConflictException('Page is already shared with this user');
      }

      const pageShare = PageShare.create({
        pageId: command.pageId,
        userId: command.targetUserId,
        accessLevel: command.accessLevel,
        createdBy: command.userId,
      });

      const saved = await this.pageShareRepo.save(pageShare, manager);

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
